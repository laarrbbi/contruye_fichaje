<?php

use App\Models\User;

function signup(array $overrides = []): array
{
    return $overrides + [
        'name' => 'Javier Morales',
        'email' => 'javier@example.es',
        'phone' => '+34 612 345 678',
        'password' => 'secreto123',
        'password_confirmation' => 'secreto123',
        'province' => '28',
    ];
}

it('signs a worker up with a trade', function () {
    $this->postJson('/api/register', signup(['role' => 'worker', 'trade' => 'encofrador']))
        ->assertCreated()
        ->assertJsonPath('data.role', 'worker')
        ->assertJsonPath('data.platform', 'empleo')
        ->assertJsonPath('data.profile.trade', 'encofrador')
        ->assertJsonPath('data.phone', '+34612345678');
});

it('needs a company name for employers and providers', function (string $role) {
    $this->postJson('/api/register', signup(['role' => $role, 'categories' => ['pintura']]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('company_name');
})->with(['employer', 'provider']);

it('puts a provider on the Obras platform with its categories', function () {
    $this->postJson('/api/register', signup(['role' => 'provider', 'company_name' => 'Reformas Sol S.L.', 'categories' => ['pintura', 'suelos']]))
        ->assertCreated()
        ->assertJsonPath('data.platform', 'obras')
        ->assertJsonPath('data.profile.categories', ['pintura', 'suelos'])
        ->assertJsonPath('data.profile.provinces', ['28']);
});

it('never lets anyone sign up as admin', function () {
    $this->postJson('/api/register', signup(['role' => 'admin']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('role');
    expect(User::query()->count())->toBe(0);
});

it('refuses a blocked account at sign-in', function () {
    User::factory()->worker()->create(['email' => 'b@example.es', 'blocked_at' => now()]);
    $this->postJson('/api/login', ['email' => 'b@example.es', 'password' => 'password'])
        ->assertUnprocessable();
});

it('keeps each platform behind its own role', function () {
    $worker = User::factory()->worker()->create();
    $client = User::factory()->client()->create();

    $this->actingAs($worker)->getJson('/api/employer/jobs')->assertForbidden();
    $this->actingAs($worker)->getJson('/api/provider/leads')->assertForbidden();
    $this->actingAs($client)->getJson('/api/employer/workers')->assertForbidden();
    $this->actingAs($client)->getJson('/api/billing/products')->assertForbidden();
});

it('answers null to a guest asking who is signed in', function () {
    $this->getJson('/api/me')->assertOk()->assertJsonPath('data', null);
    $worker = User::factory()->worker()->create();
    $this->actingAs($worker)->getJson('/api/me')->assertOk()->assertJsonPath('data.id', $worker->id);
});
