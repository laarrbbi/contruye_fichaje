<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * Development only: demo accounts with the password "password", invented
 * offers and requests. A live database gets its admin from
 * `php artisan app:create-admin`, never from here.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            throw new RuntimeException('The demo seed creates accounts with a known password: it does not run in production.');
        }

        $this->call(DemoSeeder::class);
    }
}
