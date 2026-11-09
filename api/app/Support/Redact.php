<?php

namespace App\Support;

/**
 * Text written by one side and shown to the other before the paywall: a
 * worker's presentation, a client's description of the work. A phone number
 * or an e-mail in it would be the contact the other side has not paid for, so
 * they are masked until the chat is unlocked.
 */
class Redact
{
    public static function contacts(?string $text): ?string
    {
        if ($text === null || $text === '') {
            return $text;
        }

        // E-mail addresses.
        $text = preg_replace('/[\p{L}0-9._%+\-]+@[\p{L}0-9.\-]+\.[\p{L}]{2,}/u', '•••', $text);
        // Phone numbers: 9 or more digits, allowing spaces, dots, dashes and a +.
        $text = preg_replace('/\+?\d[\d\s.\-()]{7,}\d/u', '•••', $text);
        // Links (a website with a phone on it is the same leak).
        $text = preg_replace('#\b(?:https?://|www\.)\S+#iu', '•••', $text);

        return $text;
    }
}
