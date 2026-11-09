<?php

/*
 * The construction trades a worker can have and an offer can ask for,
 * grouped as a site is: structure, masonry, installations, finishes, roofs,
 * machinery, technical staff. Keys are stable (stored in the database);
 * labels are the interface's (web/src/i18n, `trades.<key>`).
 */
return [
    'groups' => [
        'estructura' => ['encofrador', 'ferrallista', 'hormigonero', 'montador_estructuras', 'soldador', 'peon'],
        'albanileria' => ['albanil', 'oficial_primera', 'oficial_segunda', 'yesero', 'escayolista', 'alicatador', 'solador', 'pladur'],
        'instalaciones' => ['electricista', 'fontanero', 'climatizacion', 'gas', 'telecomunicaciones', 'energia_solar', 'ascensores'],
        'acabados' => ['pintor', 'carpintero', 'carpintero_metalico', 'cerrajero', 'cristalero', 'parquetista', 'marmolista'],
        'cubiertas' => ['impermeabilizador', 'tejador', 'fachadista', 'montador_andamios', 'trabajos_vertical'],
        'maquinaria' => ['gruista', 'operador_maquinaria', 'conductor_camion', 'demoliciones'],
        'tecnicos' => ['jefe_obra', 'encargado', 'arquitecto_tecnico', 'topografo', 'delineante', 'tecnico_prl', 'ingeniero', 'administrativo_obra'],
    ],
];
