<?php

use App\Models\Project;
use App\Models\User;
use App\Services\Credits;
use Illuminate\Support\Facades\Notification;

beforeEach(fn () => Notification::fake());

it('lets a person publish a request for free', function () {
    $client = User::factory()->client()->create();

    $this->actingAs($client)->postJson('/api/client/projects', [
        'title' => 'Pintar piso de 90 m²',
        'category' => 'pintura',
        'description' => 'Pintar paredes y techos de un piso de tres dormitorios, color blanco roto.',
        'province' => '28',
        'city' => 'Madrid',
        'property_type' => 'piso',
        'budget' => 'hasta_3k',
        'timing' => 'flexible',
    ])->assertCreated()->assertJsonPath('data.status', 'open');
});

it('shows a request to companies without the person\'s contact', function () {
    $project = Project::factory()->create(['description' => 'Baño de 5 m², llamar al 655 123 456 por las tardes.']);
    $provider = User::factory()->provider()->create();

    $lead = $this->actingAs($provider)->getJson('/api/provider/leads?matching=1')->assertOk()->json('data.0');

    expect($lead['unlocked'])->toBeFalse()
        ->and($lead['client']['phone'])->toBeNull()
        ->and($lead['client']['email'])->toBeNull()
        ->and($lead['postal_code'])->toBeNull()
        ->and($lead['description'])->not->toContain('655');
});

it('unlocks a request with credits, once, and opens the chat', function () {
    $project = Project::factory()->create(['budget' => '10k_30k']); // costs 2
    $provider = User::factory()->provider()->create();
    Credits::grant($provider, 3, 'grant');

    $this->actingAs($provider)->postJson("/api/provider/leads/{$project->id}/unlock")
        ->assertOk()
        ->assertJsonPath('data.unlocked', true)
        ->assertJsonPath('data.client.phone', $project->client->phone)
        ->assertJsonPath('data.credits', 1);

    // Again: nothing more is spent.
    $this->actingAs($provider)->postJson("/api/provider/leads/{$project->id}/unlock")->assertOk()->assertJsonPath('data.credits', 1);
    expect($project->fresh()->unlocks_count)->toBe(1);

    // The client sees which company answered.
    $this->actingAs($project->client)->getJson("/api/client/projects/{$project->id}")
        ->assertJsonCount(1, 'data.companies');
});

it('refuses to unlock without enough credits', function () {
    $project = Project::factory()->create(['budget' => 'mas_100k']); // costs 4
    $provider = User::factory()->provider()->create();
    Credits::grant($provider, 3, 'grant');

    $this->actingAs($provider)->postJson("/api/provider/leads/{$project->id}/unlock")
        ->assertStatus(402)->assertJsonPath('code', 'insufficient_credits');
    expect($provider->fresh()->credits)->toBe(3);
});

it('sells a request to a few companies at most', function () {
    config(['obras.max_unlocks' => 2]);
    $project = Project::factory()->create();
    foreach (range(1, 2) as $i) {
        $p = User::factory()->provider()->create();
        Credits::grant($p, 1, 'grant');
        $this->actingAs($p)->postJson("/api/provider/leads/{$project->id}/unlock")->assertOk();
    }
    $late = User::factory()->provider()->create();
    Credits::grant($late, 5, 'grant');

    $this->actingAs($late)->postJson("/api/provider/leads/{$project->id}/unlock")
        ->assertStatus(409)->assertJsonPath('code', 'full');
});

it('lists companies publicly, without their contact', function () {
    User::factory()->provider(['company_name' => 'Pinturas Norte', 'categories' => ['pintura'], 'provinces' => ['48']])->create();

    $this->getJson('/api/obras/companies?category=pintura&province=48')
        ->assertOk()
        ->assertJsonPath('data.0.company_name', 'Pinturas Norte')
        ->assertJsonMissingPath('data.0.phone');
});
