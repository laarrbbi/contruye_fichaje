<?php

use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\Empleo\DirectoryController;
use App\Http\Controllers\Api\Empleo\EmployerController;
use App\Http\Controllers\Api\Empleo\JobController;
use App\Http\Controllers\Api\Empleo\WorkerController;
use App\Http\Controllers\Api\MetaController;
use App\Http\Controllers\Api\Obras\ClientController;
use App\Http\Controllers\Api\Obras\CompanyDirectoryController;
use App\Http\Controllers\Api\Obras\ProviderController;
use App\Http\Controllers\Api\OpsController;
use App\Http\Controllers\Api\WebhookController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Reference lists and prices.
Route::get('/meta', MetaController::class);

// Who is signed in: the account, or null for a guest (no 401 on every page).
Route::get('/me', [AuthController::class, 'me']);

// ── Empleo, public: the job board ──────────────────────────────────────────
Route::get('/jobs', [JobController::class, 'index']);
Route::get('/jobs/{job}', [JobController::class, 'show'])->whereNumber('job');

// ── Obras, public: the companies that do the work ──────────────────────────
Route::get('/obras/companies', [CompanyDirectoryController::class, 'index']);

// Setting up a deploy that cannot run commands (Vercel). Off without OPS_TOKEN.
// Outside the rate limiter: its counters live in the database's cache table,
// which this very link creates. A wrong token gets a 404 either way.
Route::get('/ops/setup', [OpsController::class, 'setup'])->withoutMiddleware('throttle:api');

// Payments (server to server; the signature is checked in the controller).
Route::post('/webhooks/stripe', [WebhookController::class, 'stripe']);

Route::middleware(['auth:sanctum', 'not-blocked'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::patch('/me', [AuthController::class, 'update']);
    Route::get('/me/summary', [ConversationController::class, 'summary']);

    // Chats: whoever is in one may write in it.
    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::get('/conversations/{conversation}', [ConversationController::class, 'show'])->whereNumber('conversation');
    Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'send'])
        ->whereNumber('conversation')->middleware('throttle:messages');

    // ── Empleo: workers (always free) ──────────────────────────────────────
    Route::middleware('role:worker')->prefix('worker')->group(function () {
        Route::get('/profile', [WorkerController::class, 'profile']);
        Route::put('/profile', [WorkerController::class, 'updateProfile']);
        Route::get('/applications', [WorkerController::class, 'applications']);
        Route::delete('/applications/{application}', [WorkerController::class, 'withdraw'])->whereNumber('application');
    });
    Route::post('/jobs/{job}/apply', [WorkerController::class, 'apply'])
        ->whereNumber('job')->middleware(['role:worker', 'throttle:30,1']);

    // ── Empleo: companies hiring ───────────────────────────────────────────
    Route::middleware('role:employer')->prefix('employer')->group(function () {
        Route::get('/profile', [EmployerController::class, 'profile']);
        Route::put('/profile', [EmployerController::class, 'updateProfile']);
        Route::get('/jobs', [EmployerController::class, 'jobs']);
        Route::post('/jobs', [EmployerController::class, 'store'])->middleware('throttle:20,1');
        Route::get('/jobs/{job}', [EmployerController::class, 'show'])->whereNumber('job');
        Route::put('/jobs/{job}', [EmployerController::class, 'update'])->whereNumber('job');
        Route::post('/jobs/{job}/close', [EmployerController::class, 'close'])->whereNumber('job');
        Route::post('/jobs/{job}/reopen', [EmployerController::class, 'reopen'])->whereNumber('job');
        Route::get('/jobs/{job}/applications', [EmployerController::class, 'applications'])->whereNumber('job');
        Route::patch('/applications/{application}', [EmployerController::class, 'updateApplication'])->whereNumber('application');
        Route::post('/applications/{application}/chat', [EmployerController::class, 'openChat'])->whereNumber('application');
        Route::get('/workers', [DirectoryController::class, 'index']);
        Route::get('/workers/{worker}', [DirectoryController::class, 'show'])->whereNumber('worker');
        Route::post('/workers/{worker}/contact', [DirectoryController::class, 'contact'])->whereNumber('worker');
    });

    // ── Obras: people who want a company (always free) ─────────────────────
    Route::middleware('role:client')->prefix('client')->group(function () {
        Route::get('/projects', [ClientController::class, 'index']);
        Route::post('/projects', [ClientController::class, 'store'])->middleware('throttle:10,1');
        Route::get('/projects/{project}', [ClientController::class, 'show'])->whereNumber('project');
        Route::put('/projects/{project}', [ClientController::class, 'update'])->whereNumber('project');
        Route::post('/projects/{project}/close', [ClientController::class, 'close'])->whereNumber('project');
    });

    // ── Obras: companies that do the work ──────────────────────────────────
    Route::middleware('role:provider')->prefix('provider')->group(function () {
        Route::get('/profile', [ProviderController::class, 'profile']);
        Route::put('/profile', [ProviderController::class, 'updateProfile']);
        Route::get('/leads', [ProviderController::class, 'leads']);
        Route::get('/leads/{project}', [ProviderController::class, 'lead'])->whereNumber('project');
        Route::post('/leads/{project}/unlock', [ProviderController::class, 'unlock'])->whereNumber('project');
        Route::get('/unlocked', [ProviderController::class, 'unlocked']);
    });

    // ── Paying: employers and providers ────────────────────────────────────
    Route::middleware('role:employer,provider')->prefix('billing')->group(function () {
        Route::get('/products', [BillingController::class, 'products']);
        Route::get('/orders', [BillingController::class, 'orders']);
        Route::get('/orders/{order}', [BillingController::class, 'order'])->whereNumber('order');
        Route::get('/movements', [BillingController::class, 'movements']);
        Route::post('/checkout', [BillingController::class, 'checkout'])->middleware('throttle:20,1');
        Route::post('/orders/{order}/simulate', [BillingController::class, 'simulate'])->whereNumber('order');
    });

    // ── The owner ──────────────────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users/{user}/block', [AdminController::class, 'block'])->whereNumber('user');
        Route::post('/users/{user}/credits', [AdminController::class, 'grant'])->whereNumber('user');
        Route::get('/orders', [AdminController::class, 'orders']);
        Route::get('/jobs', [AdminController::class, 'jobs']);
        Route::post('/jobs/{job}/close', [AdminController::class, 'closeJob'])->whereNumber('job');
        Route::get('/projects', [AdminController::class, 'projects']);
        Route::post('/projects/{project}/close', [AdminController::class, 'closeProject'])->whereNumber('project');
    });
});
