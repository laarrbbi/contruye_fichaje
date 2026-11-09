<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/** The real admin of a live database (the demo seed never runs there). */
class CreateAdmin extends Command
{
    protected $signature = 'app:create-admin {email} {--name=Administración}';

    protected $description = 'Create (or promote) the admin account and print a one-time password.';

    public function handle(): int
    {
        $email = mb_strtolower((string) $this->argument('email'));
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Not an e-mail address.');

            return self::FAILURE;
        }

        $password = Str::password(20);
        $user = User::query()->firstOrNew(['email' => $email]);
        $user->forceFill([
            'name' => $user->name ?: (string) $this->option('name'),
            'role' => User::ADMIN,
            'password' => $password,
            'locale' => $user->locale ?: 'es',
        ])->save();

        $this->info("Admin: {$email}");
        $this->line("Password (shown once, change it after signing in): {$password}");

        return self::SUCCESS;
    }
}
