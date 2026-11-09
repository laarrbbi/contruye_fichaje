<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * `role:employer` — the route belongs to one side of one platform. A worker
 * never reaches an employer screen, a client never reaches Empleo.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if (! $user || ! in_array($user->role, $roles, true)) {
            abort(403, __('Esta sección no es para tu tipo de cuenta.'));
        }

        return $next($request);
    }
}
