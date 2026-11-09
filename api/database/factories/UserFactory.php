<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->firstName().' '.fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '+346'.fake()->numerify('########'),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => User::WORKER,
            'locale' => 'es',
            'province' => '28',
            'city' => 'Madrid',
            'remember_token' => Str::random(10),
        ];
    }

    public function worker(array $profile = []): static
    {
        return $this->state(['role' => User::WORKER])->afterCreating(fn (User $user) => $user->workerProfile()->create($profile + [
            'trade' => 'albanil',
            'years_experience' => 8,
            'availability' => 'immediate',
            'has_tpc' => true,
            'prl_training' => '60h',
            'visible' => true,
        ]));
    }

    public function employer(array $profile = []): static
    {
        return $this->state(['role' => User::EMPLOYER])->afterCreating(fn (User $user) => $user->employerProfile()->create($profile + [
            'company_name' => 'Construcciones '.fake()->lastName().' S.L.',
            'sector' => 'obra_nueva',
        ]));
    }

    public function client(): static
    {
        return $this->state(['role' => User::CLIENT]);
    }

    public function provider(array $profile = []): static
    {
        return $this->state(['role' => User::PROVIDER])->afterCreating(fn (User $user) => $user->providerProfile()->create($profile + [
            'company_name' => 'Reformas '.fake()->lastName().' S.L.',
            'categories' => ['reforma_integral', 'reforma_bano'],
            'provinces' => ['28'],
            'listed' => true,
        ]));
    }

    public function admin(): static
    {
        return $this->state(['role' => User::ADMIN]);
    }
}
