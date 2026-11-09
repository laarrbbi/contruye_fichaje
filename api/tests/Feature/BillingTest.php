<?php

use App\Models\JobPost;
use App\Models\Order;
use App\Models\User;
use App\Services\Catalog;
use App\Services\OrderFulfillment;

it('splits a gross price into base and IVA that add up', function () {
    $split = Catalog::split(3900);
    expect($split['base_c'] + $split['vat_c'])->toBe(3900)
        ->and($split['base_c'])->toBe(3223);
});

it('only sells a role its own products', function () {
    $employer = User::factory()->employer()->create();
    config(['services.stripe.simulate' => true]);

    $this->actingAs($employer)->postJson('/api/billing/checkout', ['product' => 'leads_5'])
        ->assertUnprocessable()->assertJsonValidationErrors('product');
});

it('activates an offer through a simulated payment on a local demo', function () {
    config(['services.stripe.simulate' => true]);
    $post = JobPost::factory()->create();

    $order = $this->actingAs($post->employer)->postJson('/api/billing/checkout', ['product' => 'offer_premium', 'job_post_id' => $post->id])
        ->assertCreated()->assertJsonPath('data.simulated', true)->json('data.order_id');

    $this->actingAs($post->employer)->postJson("/api/billing/orders/{$order}/simulate")->assertOk()->assertJsonPath('data.status', 'paid');

    $post->refresh();
    expect($post->isUnlocked())->toBeTrue()->and($post->isFeatured())->toBeTrue();
});

it('refuses simulated payments in production', function () {
    config(['services.stripe.simulate' => true]);
    app()->detectEnvironment(fn () => 'production');
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)->postJson('/api/billing/checkout', ['product' => 'contacts_10'])
        ->assertStatus(503)->assertJsonPath('code', 'payments_unavailable');
});

it('will not activate another company\'s offer', function () {
    config(['services.stripe.simulate' => true]);
    $post = JobPost::factory()->create();
    $other = User::factory()->employer()->create();

    $this->actingAs($other)->postJson('/api/billing/checkout', ['product' => 'offer_active', 'job_post_id' => $post->id])
        ->assertUnprocessable();
});

it('delivers an order once, however many times it is reported paid', function () {
    $provider = User::factory()->provider()->create();
    $order = Order::create(Catalog::split(3500) + ['user_id' => $provider->id, 'product' => 'leads_5', 'status' => 'pending']);

    expect(OrderFulfillment::markPaid($order, 'stripe'))->toBeTrue()
        ->and(OrderFulfillment::markPaid($order, 'stripe'))->toBeFalse()
        ->and($provider->fresh()->credits)->toBe(5);
});

it('gives the pass its days and its contacts', function () {
    $employer = User::factory()->employer()->create();
    $order = Order::create(Catalog::split(14900) + ['user_id' => $employer->id, 'product' => 'employer_pass', 'status' => 'pending']);
    OrderFulfillment::markPaid($order, 'stripe');

    $employer->refresh();
    expect($employer->hasActivePass())->toBeTrue()->and($employer->credits)->toBe(25);
});

it('rejects a webhook without a valid signature', function () {
    config(['services.stripe.webhook_secret' => 'whsec_test']);
    $this->postJson('/api/webhooks/stripe', ['type' => 'checkout.session.completed'], ['Stripe-Signature' => 't=1,v1=forged'])
        ->assertForbidden();
});

it('rejects every webhook while no secret is set', function () {
    config(['services.stripe.webhook_secret' => '']);
    $payload = json_encode(['type' => 'checkout.session.completed']);
    $sig = 't='.time().',v1='.hash_hmac('sha256', time().'.'.$payload, '');
    $this->call('POST', '/api/webhooks/stripe', [], [], [], ['HTTP_STRIPE_SIGNATURE' => $sig, 'CONTENT_TYPE' => 'application/json'], $payload)
        ->assertForbidden();
});

it('settles a signed checkout.session.completed with the right amount', function () {
    config(['services.stripe.webhook_secret' => 'whsec_test']);
    $provider = User::factory()->provider()->create();
    $order = Order::create(Catalog::split(3500) + ['user_id' => $provider->id, 'product' => 'leads_5', 'status' => 'pending', 'stripe_session_id' => 'cs_test_1']);

    $send = function (int $amount) use ($order) {
        $payload = json_encode([
            'id' => 'evt_1', 'object' => 'event', 'type' => 'checkout.session.completed',
            'data' => ['object' => ['id' => 'cs_test_1', 'object' => 'checkout.session', 'amount_total' => $amount, 'currency' => 'eur', 'payment_status' => 'paid', 'metadata' => ['order_id' => (string) $order->id]]],
        ]);
        $t = time();
        $sig = "t={$t},v1=".hash_hmac('sha256', "{$t}.{$payload}", 'whsec_test');

        return $this->call('POST', '/api/webhooks/stripe', [], [], [], ['HTTP_STRIPE_SIGNATURE' => $sig, 'CONTENT_TYPE' => 'application/json'], $payload);
    };

    $send(100)->assertOk();
    expect($order->fresh()->status)->toBe('pending');

    $send(3500)->assertOk();
    expect($order->fresh()->status)->toBe('paid')->and($provider->fresh()->credits)->toBe(5);
});
