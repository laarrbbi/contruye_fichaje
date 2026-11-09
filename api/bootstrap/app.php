<?php

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\RejectBlocked;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Behind a TLS terminator: private ranges and the loopback (on Vercel
        // the runtime proxies each request from 127.0.0.1), never '*'.
        $middleware->trustProxies(
            at: ['127.0.0.1', '::1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO,
        );

        $middleware->statefulApi();

        $middleware->redirectGuestsTo(fn (Request $request) => $request->expectsJson()
            ? null
            : rtrim((string) config('app.frontend_url'), '/').'/login');

        $middleware->api(append: [
            SetLocale::class,
            'throttle:api',
        ]);

        $middleware->alias([
            'role' => EnsureRole::class,
            'not-blocked' => RejectBlocked::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // A bare abort(404) sent {"message": ""}, and a missing model leaked
        // its class name. Explicit messages pass through untouched.
        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            if (! $request->expectsJson()) {
                return null;
            }
            $message = $e->getMessage();
            if ($message !== '' && ! str_starts_with($message, 'No query results for model')) {
                return null;
            }
            $generic = match ($e->getStatusCode()) {
                401 => __('Inicia sesión para continuar.'),
                403 => __('No tienes acceso a esto.'),
                404 => __('No encontrado.'),
                409 => __('Esta acción ya no es posible.'),
                default => null,
            };

            return $generic === null ? null : response()->json(['message' => $generic], $e->getStatusCode(), $e->getHeaders());
        });

        $exceptions->render(fn (ThrottleRequestsException $e, Request $request) => response()->json([
            'message' => __('Demasiados intentos. Prueba de nuevo en un momento.'),
        ], 429, $e->getHeaders()));
    })
    ->create();
