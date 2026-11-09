<?php

namespace App\Services;

use App\Models\User;
use InvalidArgumentException;

/**
 * The products of config/catalog.php, and how a price splits into base and
 * IVA. The only place a price is read.
 */
class Catalog
{
    /** @return array<string, array<string, mixed>> */
    public static function all(): array
    {
        return config('catalog.products');
    }

    /** @return array<string, mixed> */
    public static function get(string $key): array
    {
        $product = self::all()[$key] ?? null;
        if ($product === null) {
            throw new InvalidArgumentException("Unknown product [$key].");
        }

        return $product;
    }

    public static function exists(string $key): bool
    {
        return array_key_exists($key, self::all());
    }

    /** @return array<string, array<string, mixed>> what this user can buy */
    public static function forUser(User $user): array
    {
        return array_filter(self::all(), fn (array $product) => $product['role'] === $user->role);
    }

    /**
     * A gross price (IVA included) split into its base and its IVA, in cents.
     * The base is rounded; the IVA is the rest, so the two always add up.
     *
     * @return array{amount_c: int, base_c: int, vat_c: int}
     */
    public static function split(int $grossCents): array
    {
        $rate = (int) config('catalog.vat_rate');
        $base = (int) round($grossCents * 100 / (100 + $rate));

        return ['amount_c' => $grossCents, 'base_c' => $base, 'vat_c' => $grossCents - $base];
    }

    /** The public shape of a product, for the pricing pages. */
    public static function present(string $key, array $product): array
    {
        return [
            'key' => $key,
            'role' => $product['role'],
            'price_c' => $product['price_c'],
            'credits' => $product['credits'] ?? null,
            'days' => $product['days'] ?? $product['pass_days'] ?? null,
            'needs_offer' => (bool) ($product['needs_offer'] ?? false),
            'featured' => (bool) ($product['featured'] ?? false),
            'pass' => isset($product['pass_days']),
        ];
    }
}
