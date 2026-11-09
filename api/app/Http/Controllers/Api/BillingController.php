<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreditMovement;
use App\Models\JobPost;
use App\Models\Order;
use App\Services\Catalog;
use App\Services\OrderFulfillment;
use App\Services\StripeService;
use App\Support\Present;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Buying: an offer's activation, a pass, contact or lead credits. */
class BillingController extends Controller
{
    public function products(Request $request): JsonResponse
    {
        $products = [];
        foreach (Catalog::forUser($request->user()) as $key => $product) {
            $products[] = Catalog::present($key, $product);
        }

        return response()->json(['data' => $products]);
    }

    public function orders(Request $request): JsonResponse
    {
        $orders = $request->user()->orders()->with('jobPost:id,title')->latest('id')->limit(100)->get();

        return response()->json(['data' => $orders->map(fn (Order $o) => Present::order($o))->values()]);
    }

    public function movements(Request $request): JsonResponse
    {
        $movements = CreditMovement::query()->where('user_id', $request->user()->id)->latest('id')->limit(100)->get();

        return response()->json(['data' => $movements->map(fn (CreditMovement $m) => [
            'id' => $m->id,
            'delta' => $m->delta,
            'reason' => $m->reason,
            'reference' => $m->reference,
            'at' => $m->created_at?->toIso8601String(),
        ])->values()]);
    }

    public function order(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        return response()->json(['data' => Present::order($order->load('jobPost:id,title'))]);
    }

    /**
     * Start a payment. With Stripe set up: a hosted Checkout session. Without
     * it, on a local demo only: a simulated payment screen. Otherwise 503.
     */
    public function checkout(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'product' => ['required', 'string', Rule::in(array_keys(Catalog::forUser($user)))],
            'job_post_id' => ['nullable', 'integer'],
        ]);
        $product = Catalog::get($data['product']);

        $post = null;
        if (! empty($product['needs_offer'])) {
            $post = JobPost::query()->whereKey($data['job_post_id'] ?? 0)->where('employer_id', $user->id)->first();
            if (! $post) {
                return response()->json(['message' => __('Elige la oferta que quieres activar.'), 'errors' => ['job_post_id' => [__('Elige la oferta que quieres activar.')]]], 422);
            }
        }

        $stripe = StripeService::isConfigured();
        $simulate = ! $stripe && StripeService::simulationAllowed();
        if (! $stripe && ! $simulate) {
            return response()->json(['message' => __('Los pagos no están disponibles en este momento.'), 'code' => 'payments_unavailable'], 503);
        }

        $order = Order::create(Catalog::split((int) $product['price_c']) + [
            'user_id' => $user->id,
            'product' => $data['product'],
            'job_post_id' => $post?->id,
            'status' => 'pending',
            'method' => $stripe ? 'stripe' : 'simulated',
        ]);

        $front = rtrim((string) config('app.frontend_url'), '/');

        if ($simulate) {
            return response()->json(['data' => ['order_id' => $order->id, 'url' => $front.'/pago/simulado/'.$order->id, 'simulated' => true]], 201);
        }

        $session = StripeService::fromConfig()->createCheckoutSession(
            $order,
            $user,
            __('catalog.'.$data['product']).($post ? ' — '.$post->title : ''),
            $front.'/pago/ok?order='.$order->id,
            $front.'/pago/cancelado?order='.$order->id,
        );
        $order->forceFill(['stripe_session_id' => $session['id']])->save();

        return response()->json(['data' => ['order_id' => $order->id, 'url' => $session['url'], 'simulated' => false]], 201);
    }

    /** The demo's "pay" button. Refused in production and whenever Stripe is set up. */
    public function simulate(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 404);
        abort_unless(StripeService::simulationAllowed() && ! StripeService::isConfigured() && $order->method === 'simulated', 403);
        abort_unless($order->status === 'pending', 409);

        OrderFulfillment::markPaid($order, 'simulated');

        return response()->json(['data' => Present::order($order->fresh('jobPost:id,title'))]);
    }
}
