<?php

use App\Support\Redact;

it('masks phones, e-mails and links', function (string $text) {
    expect(Redact::contacts($text))->toContain('•••');
})->with([
    'Llámame al 612 345 678',
    'mi móvil +34 612-345-678',
    'escribe a pepe.obra@gmail.com',
    'mira www.miweb.es',
]);

it('leaves ordinary text alone', function () {
    expect(Redact::contacts('12 años de oficial, 3 obras de 40 viviendas'))->toBe('12 años de oficial, 3 obras de 40 viviendas');
});
