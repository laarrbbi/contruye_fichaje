<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $supported = config('app.supported_locales', ['es', 'en']);
        $locale = $request->getPreferredLanguage($supported) ?? 'es';
        app()->setLocale(in_array($locale, $supported, true) ? $locale : 'es');

        return $next($request);
    }
}
