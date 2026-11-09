<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderFulfillment;
use App\Services\StripeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * checkout.session.completed settles the order — after the signature, the
     * amount and the currency all match. Replays are harmless (markPaid is
     * idempotent).
     */
    public function stripe(Request $request): JsonResponse
    {
        $event = StripeService::fromConfig()->constructEvent($request->getContent(), $request->header('Stripe-Signature'));
        if ($event === null) {
            return response()->json(['message' => 'Invalid signature.'], 403);
        }

        if ($event->type !== 'checkout.session.completed') {
            return response()->json(['received' => true]);
        }

        $session = $event->data->object;
        $order = Order::query()->find((int) ($session->metadata->order_id ?? 0));
        if (! $order) {
            Log::warning('Stripe webhook: unknown order', ['session' => $session->id ?? null]);

            return response()->json(['received' => true]);
        }

        $amountOk = (int) ($session->amount_total ?? -1) === $order->amount_c;
        $currencyOk = strtolower((string) ($session->currency ?? '')) === 'eur';
        $paid = ($session->payment_status ?? null) === 'paid';
        $sessionOk = $order->stripe_session_id === null || $order->stripe_session_id === ($session->id ?? null);

        if (! $amountOk || ! $currencyOk || ! $sessionOk) {
            Log::error('Stripe webhook: amount, currency or session mismatch', ['order' => $order->id]);

            return response()->json(['received' => true]);
        }

        if ($paid) {
            OrderFulfillment::markPaid($order, 'stripe');
        }

        return response()->json(['received' => true]);
    }
}
