<?php

/*
 * Obras: what a person can ask a construction company for.
 */
return [
    'categories' => [
        'reforma_integral',
        'reforma_cocina',
        'reforma_bano',
        'obra_nueva',
        'ampliacion',
        'rehabilitacion_fachada',
        'cubiertas_tejados',
        'impermeabilizacion',
        'electricidad',
        'fontaneria',
        'climatizacion',
        'energia_solar',
        'pintura',
        'carpinteria',
        'suelos',
        'pladur',
        'piscinas',
        'demoliciones',
        'cerramientos',
        'otros',
    ],

    'property_types' => ['piso', 'casa', 'local', 'nave', 'edificio', 'solar'],

    'timings' => ['urgente', '1_3_meses', '3_6_meses', 'flexible'],

    // What unlocking a request costs a company, in credits, by the size of
    // the work: a kitchen is not a building.
    'budgets' => [
        'hasta_3k' => 1,
        '3k_10k' => 1,
        '10k_30k' => 2,
        '30k_100k' => 3,
        'mas_100k' => 4,
        'sin_definir' => 1,
    ],

    // How many companies can unlock one request: the person gets a few
    // quotes, not a flood of calls.
    'max_unlocks' => (int) env('OBRAS_MAX_UNLOCKS', 4),

    // How long a request stays open.
    'request_days' => 45,
];
