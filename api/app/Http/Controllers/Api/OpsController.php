<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Artisan;

/**
 * Setting up a deploy that cannot run commands (Vercel): one visit to
 * /api/ops/setup?token=… creates or updates the tables and, on a test deploy
 * with DEMO_SEED=true, loads the demo accounts once.
 *
 * Off unless OPS_TOKEN is set (24 characters or more), and answers 404 to a
 * wrong token, so it does not exist for anyone else. The demo seed and the
 * reset (?reset=1, a fresh demo database) never run in production.
 */
class OpsController extends Controller
{
    public function setup(Request $request): Response
    {
        $token = (string) config('services.ops.token');
        $given = (string) ($request->header('X-Ops-Token') ?? $request->query('token', ''));
        abort_if(strlen($token) < 24 || ! hash_equals($token, $given), 404);

        $demo = (bool) config('services.ops.demo_seed') && ! app()->environment('production');
        $reset = $demo && $request->boolean('reset');

        Artisan::call($reset ? 'migrate:fresh' : 'migrate', ['--force' => true]);
        $output = Artisan::output();

        if ($demo && ($reset || ! User::query()->exists())) {
            Artisan::call('db:seed', ['--force' => true]);
            $output .= Artisan::output();
        }

        return response($output."\nOK\n", 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
            'Cache-Control' => 'no-store',
        ]);
    }
}
