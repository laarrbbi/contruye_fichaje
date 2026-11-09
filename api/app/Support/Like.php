<?php

namespace App\Support;

/** A LIKE pattern that matches the text as typed: % and _ are literal. */
class Like
{
    public static function contains(string $text): string
    {
        return '%'.addcslashes(trim($text), '%_\\').'%';
    }
}
