<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Stripe\Event;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;

/**
 * Stripe hosted Checkout, card payments in euros. The order is settled by the
 * webhook only, never by the browser coming back.
 */
class StripeService
{
    public function __construct(
        private readonly StripeClient $client,
        private readonly string $webhookSecret,
    ) {}

    public static function fromConfig(): self
    {
        $secret = (string) config('services.stripe.secret');

        return new self(
            new StripeClient($secret === '' ? [] : $secret),
            (string) config('services.stripe.webhook_secret'),
        );
    }

    /** Both halves are needed: the key opens the session, the secret settles it. */
    public static function isConfigured(): bool
    {
        return trim((string) config('services.stripe.secret')) !== ''
            && trim((string) config('services.stripe.webhook_secret')) !== '';
    }

    /**
     * Simulated payments: a local demo without Stripe. Never in production,
     * whatever the setting says.
     */
    public static function simulationAllowed(): bool
    {
        return (bool) config('services.stripe.simulate') && ! app()->environment('production');
    }

    /** @return array{id: string, url: string} */
    public function createCheckoutSession(Order $order, User $user, string $label, string $successUrl, string $cancelUrl): array
    {
        $session = $this->client->checkout->sessions->create([
            'mode' => 'payment',
            'customer_email' => $user->email,
            'locale' => $user->locale === 'en' ? 'en' : 'es',
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => 'eur',
                    'unit_amount' => $order->amount_c,
                    'product_data' => ['name' => $label],
                ],
            ]],
            'metadata' => ['order_id' => (string) $order->id],
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
        ]);

        return ['id' => $session->id, 'url' => (string) $session->url];
    }

    /** The decoded event, or null when the signature does not hold. */
    public function constructEvent(string $rawPayload, ?string $signatureHeader): ?Event
    {
        if ($signatureHeader === null || $signatureHeader === '') {
            return null;
        }

        // The SDK would verify an HMAC made with an empty secret, which anyone
        // can forge: an unset secret rejects everything.
        if ($this->webhookSecret === '') {
            Log::error('Stripe webhook rejected: STRIPE_WEBHOOK_SECRET is not configured.');

            return null;
        }

        try {
            return Webhook::constructEvent($rawPayload, $signatureHeader, $this->webhookSecret);
        } catch (\UnexpectedValueException|SignatureVerificationException) {
            return null;
        }
    }
}
