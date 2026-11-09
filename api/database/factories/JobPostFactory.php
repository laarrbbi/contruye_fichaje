<?php

namespace Database\Factories;

use App\Models\JobPost;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobPost>
 */
class JobPostFactory extends Factory
{
    protected $model = JobPost::class;

    public function definition(): array
    {
        return [
            'employer_id' => User::factory()->employer(),
            'title' => 'Oficial de primera albañil',
            'trade' => 'albanil',
            'province' => '28',
            'city' => 'Madrid',
            'contract_type' => 'fijo_obra',
            'workday' => 'completa',
            'salary_min' => 1800,
            'salary_max' => 2200,
            'salary_period' => 'mes',
            'start' => 'inmediata',
            'vacancies' => 2,
            'experience_min' => 3,
            'description' => 'Buscamos oficial de primera para obra de 40 viviendas en Valdebebas. Ladrillo cara vista y tabiquería.',
            'requires_tpc' => true,
            'status' => 'active',
            'expires_at' => now()->addDays(30),
        ];
    }

    public function unlocked(): static
    {
        return $this->state(['unlocked_until' => now()->addDays(30)]);
    }
}
