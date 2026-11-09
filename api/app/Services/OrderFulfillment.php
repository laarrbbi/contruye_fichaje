<?php

namespace App\Services;

use App\Models\JobPost;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

/**
 * An order turns paid exactly once, whoever reports it (the Stripe webhook,
 * which can arrive twice, the simulated checkout, an admin), and what it buys
 * is delivered in the same transaction.
 */
class OrderFulfillment
{
    /** @return bool true when this call marked it paid, false if it already was */
    public static function markPaid(Order $order, string $method): bool
    {
        return DB::transaction(function () use ($order, $method) {
            $locked = Order::query()->lockForUpdate()->findOrFail($order->id);
            if ($locked->status === 'paid') {
                return false;
            }

            $locked->forceFill([
                'status' => 'paid',
                'method' => $method,
                'paid_at' => now(),
            ])->save();

            self::deliver($locked);
            $order->refresh();

            return true;
        });
    }

    private static function deliver(Order $order): void
    {
        $product = Catalog::get($order->product);
        $user = $order->user;

        if (! empty($product['needs_offer']) && $order->job_post_id) {
            $post = JobPost::query()->lockForUpdate()->findOrFail($order->job_post_id);
            $days = (int) ($product['days'] ?? config('catalog.offer_days'));
            // Paying again extends from where it stands, never shortens it.
            $from = $post->unlocked_until?->isFuture() ? $post->unlocked_until : now();
            $post->unlocked_until = $from->copy()->addDays($days);
            if (! empty($product['featured'])) {
                $featuredFrom = $post->featured_until?->isFuture() ? $post->featured_until : now();
                $post->featured_until = $featuredFrom->copy()->addDays($days);
            }
            // An activated offer stays published at least as long as its chats.
            if ($post->expires_at->lt($post->unlocked_until)) {
                $post->expires_at = $post->unlocked_until;
            }
            $post->save();
        }

        if (! empty($product['pass_days'])) {
            $from = $user->pass_until?->isFuture() ? $user->pass_until : now();
            $user->forceFill(['pass_until' => $from->copy()->addDays((int) $product['pass_days'])])->save();
        }

        if (! empty($product['credits'])) {
            Credits::grant($user, (int) $product['credits'], 'purchase', $order->id, $order->product);
        }
    }
}
