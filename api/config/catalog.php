<?php

/*
 * What can be bought, and by whom. Prices are in cents, IVA included (21 %);
 * the order keeps base and IVA apart for the invoice.
 *
 * These are starting prices for the owner to set: change them here (or in
 * .env) before going live. Nothing else in the code hardcodes a price.
 *
 * Who pays (the JobToday model):
 * - Workers and private clients never pay.
 * - Employers publish for free; they pay to open the chat with the people who
 *   applied (per offer, or with the 30-day pass) and to contact workers from
 *   the directory (contact credits).
 * - Providers (Obras) buy credits to unlock the requests people publish.
 */
return [
    'vat_rate' => 21,

    // Days an activated offer keeps its chats open, and a free offer stays up.
    'offer_days' => 30,

    'products' => [
        // ── Empleo: employers ───────────────────────────────────────────
        'offer_active' => [
            'role' => 'employer',
            'price_c' => (int) env('PRICE_OFFER_ACTIVE', 3900),
            'needs_offer' => true,
            'days' => 30,
        ],
        'offer_premium' => [
            'role' => 'employer',
            'price_c' => (int) env('PRICE_OFFER_PREMIUM', 6900),
            'needs_offer' => true,
            'days' => 30,
            'featured' => true,
        ],
        'contacts_10' => [
            'role' => 'employer',
            'price_c' => (int) env('PRICE_CONTACTS_10', 4900),
            'credits' => 10,
        ],
        'employer_pass' => [
            'role' => 'employer',
            'price_c' => (int) env('PRICE_EMPLOYER_PASS', 14900),
            'pass_days' => 30,
            'credits' => 25,
        ],

        // ── Obras: providers ────────────────────────────────────────────
        'leads_5' => [
            'role' => 'provider',
            'price_c' => (int) env('PRICE_LEADS_5', 3500),
            'credits' => 5,
        ],
        'leads_15' => [
            'role' => 'provider',
            'price_c' => (int) env('PRICE_LEADS_15', 8900),
            'credits' => 15,
        ],
        'leads_40' => [
            'role' => 'provider',
            'price_c' => (int) env('PRICE_LEADS_40', 19900),
            'credits' => 40,
        ],
    ],
];
