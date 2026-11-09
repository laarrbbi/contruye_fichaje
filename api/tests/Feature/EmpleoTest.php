<?php

use App\Models\Application;
use App\Models\JobPost;
use App\Models\User;
use App\Notifications\ChatOpened;
use App\Notifications\NewApplication;
use App\Services\Credits;
use Illuminate\Support\Facades\Notification;

beforeEach(fn () => Notification::fake());

it('publishes an offer for free and lists it on the board', function () {
    $employer = User::factory()->employer()->create();

    $id = $this->actingAs($employer)->postJson('/api/employer/jobs', [
        'title' => 'Gruista para obra en Vallecas',
        'trade' => 'gruista',
        'province' => '28',
        'city' => 'Madrid',
        'contract_type' => 'fijo_obra',
        'workday' => 'completa',
        'salary_min' => 2200,
        'salary_max' => 2600,
        'salary_period' => 'mes',
        'start' => 'inmediata',
        'vacancies' => 1,
        'experience_min' => 3,
        'description' => 'Grúa torre en edificio de 12 plantas. Horario de 8 a 17 h con una hora para comer.',
        'requires_tpc' => true,
    ])->assertCreated()->assertJsonPath('data.unlocked', false)->json('data.id');

    $this->getJson('/api/jobs?trade=gruista')->assertOk()->assertJsonPath('data.0.id', $id);
});

it('lets a worker apply once, and tells the company', function () {
    $post = JobPost::factory()->create();
    $worker = User::factory()->worker()->create();

    $this->actingAs($worker)->postJson("/api/jobs/{$post->id}/apply", ['message' => 'Disponible'])->assertCreated();
    $this->actingAs($worker)->postJson("/api/jobs/{$post->id}/apply")->assertOk();

    expect(Application::query()->count())->toBe(1);
    Notification::assertSentTo($post->employer, NewApplication::class);
    $this->actingAs($worker)->getJson("/api/jobs/{$post->id}")->assertJsonPath('data.applied', true);
});

it('does not take applications on a closed or expired offer', function () {
    $worker = User::factory()->worker()->create();
    $closed = JobPost::factory()->create(['status' => 'closed']);
    $expired = JobPost::factory()->create(['expires_at' => now()->subDay()]);

    $this->actingAs($worker)->postJson("/api/jobs/{$closed->id}/apply")->assertUnprocessable();
    $this->actingAs($worker)->postJson("/api/jobs/{$expired->id}/apply")->assertUnprocessable();
});

it('shows applicants of a free offer without their contact', function () {
    $post = JobPost::factory()->create();
    $worker = User::factory()->worker(['bio' => 'Llamadme al 612 345 678 o a javi@correo.es'])->create(['name' => 'Javier Morales Díaz']);
    Application::create(['job_post_id' => $post->id, 'worker_id' => $worker->id, 'message' => 'Mi móvil: 612345678']);

    $row = $this->actingAs($post->employer)->getJson("/api/employer/jobs/{$post->id}/applications")
        ->assertOk()->assertJsonPath('meta.unlocked', false)->json('data.0');

    expect($row['worker']['unlocked'])->toBeFalse()
        ->and($row['worker']['name'])->toBe('Javier D.')
        ->and($row['worker']['phone'])->toBeNull()
        ->and($row['worker']['email'])->toBeNull()
        ->and($row['worker']['profile']['bio'])->not->toContain('612')
        ->and($row['worker']['profile']['bio'])->not->toContain('@')
        ->and($row['message'])->not->toContain('612345678');

    $application = Application::first();
    $this->actingAs($post->employer)->postJson("/api/employer/applications/{$application->id}/chat")
        ->assertStatus(402)->assertJsonPath('code', 'offer_locked');
});

it('opens the chat and the contact once the offer is unlocked', function () {
    $post = JobPost::factory()->unlocked()->create();
    $worker = User::factory()->worker()->create(['name' => 'Javier Morales']);
    $application = Application::create(['job_post_id' => $post->id, 'worker_id' => $worker->id]);

    $this->actingAs($post->employer)->getJson("/api/employer/jobs/{$post->id}/applications")
        ->assertJsonPath('data.0.worker.name', 'Javier Morales')
        ->assertJsonPath('data.0.worker.phone', $worker->phone);

    $conversation = $this->actingAs($post->employer)->postJson("/api/employer/applications/{$application->id}/chat")
        ->assertOk()->json('data.conversation_id');

    Notification::assertSentTo($worker, ChatOpened::class);

    // Both sides can write; a third party cannot read it.
    $this->actingAs($worker)->postJson("/api/conversations/{$conversation}/messages", ['body' => 'Hola'])->assertCreated();
    $this->actingAs(User::factory()->worker()->create())->getJson("/api/conversations/{$conversation}")->assertNotFound();
    $this->actingAs($post->employer)->getJson("/api/conversations/{$conversation}")->assertOk()->assertJsonPath('data.0.body', 'Hola');
});

it('unlocks every offer of a company holding the pass', function () {
    $post = JobPost::factory()->create();
    $post->employer->forceFill(['pass_until' => now()->addDays(10)])->save();
    $application = Application::create(['job_post_id' => $post->id, 'worker_id' => User::factory()->worker()->create()->id]);

    $this->actingAs($post->employer)->postJson("/api/employer/applications/{$application->id}/chat")->assertOk();
});

it('spends one contact credit to reach a worker from the directory, once', function () {
    $employer = User::factory()->employer()->create();
    $worker = User::factory()->worker()->create();

    $this->actingAs($employer)->postJson("/api/employer/workers/{$worker->id}/contact")
        ->assertStatus(402)->assertJsonPath('code', 'insufficient_credits');

    Credits::grant($employer, 2, 'grant');
    $this->actingAs($employer)->postJson("/api/employer/workers/{$worker->id}/contact")->assertOk()->assertJsonPath('data.credits', 1);
    $this->actingAs($employer)->postJson("/api/employer/workers/{$worker->id}/contact")->assertOk()->assertJsonPath('data.credits', 1);

    $this->actingAs($employer)->getJson("/api/employer/workers/{$worker->id}")->assertJsonPath('data.unlocked', true);
});

it('keeps hidden workers out of the directory', function () {
    $employer = User::factory()->employer()->create();
    User::factory()->worker(['visible' => false])->create();
    User::factory()->worker()->create();

    $this->actingAs($employer)->getJson('/api/employer/workers')->assertJsonCount(1, 'data');
});

it('does not let a company read another company\'s applicants', function () {
    $post = JobPost::factory()->create();
    $other = User::factory()->employer()->create();

    $this->actingAs($other)->getJson("/api/employer/jobs/{$post->id}/applications")->assertNotFound();
});
