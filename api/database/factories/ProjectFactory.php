<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'client_id' => User::factory()->client(),
            'title' => 'Reforma completa de baño',
            'category' => 'reforma_bano',
            'description' => 'Quiero cambiar la bañera por plato de ducha, alicatar de nuevo y cambiar sanitarios. Baño de 5 m².',
            'province' => '28',
            'city' => 'Madrid',
            'postal_code' => '28039',
            'property_type' => 'piso',
            'budget' => '3k_10k',
            'timing' => '1_3_meses',
            'status' => 'open',
            'expires_at' => now()->addDays(45),
        ];
    }
}
