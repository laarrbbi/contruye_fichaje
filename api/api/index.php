<?php

/*
 * Vercel entry point (vercel-php runtime, see ../vercel.json).
 *
 * Vercel runs PHP's built-in server with this file as the router, inside a
 * function whose files are read-only except /tmp, with no long-running
 * process. Before handing over to Laravel's own public/index.php, this file:
 *
 * 1. Moves everything Laravel writes (storage, compiled views, the package and
 *    service manifests) to /tmp.
 * 2. Sets the defaults a serverless deploy needs, each only when the Vercel
 *    dashboard does not set it: logs to stderr (Vercel's log view), sessions
 *    and cache in the database, mail and queue run in the request, and the
 *    database taken from the Neon/Postgres integration's DATABASE_URL.
 * 3. Fixes the script name: Laravel would otherwise read "/api" as the app's
 *    base path (from /api/index.php) and strip it from every /api/... route.
 *
 * Nothing here runs outside Vercel: local and Docker runs use public/index.php.
 */

$root = dirname(__DIR__);
$tmp = rtrim(getenv('LARAVEL_TMP_ROOT') ?: '/tmp', '/').'/laravel';

$set = function (string $key, ?string $value): void {
    if ($value === null || $value === '') {
        return;
    }
    $current = getenv($key);
    if (($current !== false && $current !== '') || isset($_ENV[$key]) || isset($_SERVER[$key])) {
        return; // The dashboard's value wins.
    }
    putenv("{$key}={$value}");
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
};

// 1. Writable places.
foreach (['storage/app/private', 'storage/app/public', 'storage/framework/cache/data', 'storage/framework/sessions', 'storage/framework/views', 'storage/logs', 'cache'] as $dir) {
    if (! is_dir("{$tmp}/{$dir}")) {
        @mkdir("{$tmp}/{$dir}", 0755, true);
    }
}
$set('LARAVEL_STORAGE_PATH', "{$tmp}/storage");
$set('VIEW_COMPILED_PATH', "{$tmp}/storage/framework/views");
foreach (['APP_SERVICES_CACHE' => 'services.php', 'APP_PACKAGES_CACHE' => 'packages.php', 'APP_CONFIG_CACHE' => 'config.php', 'APP_ROUTES_CACHE' => 'routes.php', 'APP_EVENTS_CACHE' => 'events.php'] as $key => $file) {
    $set($key, "{$tmp}/cache/{$file}");
}

// 2. Serverless defaults.
$set('LOG_CHANNEL', 'stderr');
$set('SESSION_DRIVER', 'database');
$set('SESSION_SECURE_COOKIE', 'true');
$set('CACHE_STORE', 'database');
$set('QUEUE_CONNECTION', 'sync');
$set('MAIL_MAILER', 'log');
$set('APP_DEBUG', 'false');

// The Postgres integration (Neon) provides DATABASE_URL; the unpooled one is
// a plain connection, which suits a handful of short-lived functions best.
$databaseUrl = getenv('DATABASE_URL_UNPOOLED') ?: getenv('POSTGRES_URL_NON_POOLING') ?: getenv('DATABASE_URL') ?: getenv('POSTGRES_URL');
if ($databaseUrl) {
    $set('DB_CONNECTION', 'pgsql');
    $set('DB_URL', $databaseUrl);
}

// The address the app is served from, for links in e-mails and Stripe's return.
$production = getenv('VERCEL_PROJECT_PRODUCTION_URL');
if ($production) {
    $set('APP_URL', "https://{$production}");
    $set('FRONTEND_URL', "https://{$production}");
}

// 3. Laravel's base path is the domain's root, not /api.
$_SERVER['SCRIPT_FILENAME'] = $root.'/public/index.php';
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

require $root.'/public/index.php';
