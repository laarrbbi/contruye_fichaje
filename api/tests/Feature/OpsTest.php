<?php

use App\Models\User;

const OPS_TOKEN = 'a-long-test-token-of-32-characters!!';

it('does not exist without a token configured', function () {
    config(['services.ops.token' => '']);
    $this->get('/api/ops/setup?token=')->assertNotFound();
});

it('does not exist for a wrong or short token', function () {
    config(['services.ops.token' => 'short']);
    $this->get('/api/ops/setup?token=short')->assertNotFound();

    config(['services.ops.token' => OPS_TOKEN]);
    $this->get('/api/ops/setup?token=wrong')->assertNotFound();
});

it('migrates, and loads the demo once on a test deploy', function () {
    config(['services.ops.token' => OPS_TOKEN, 'services.ops.demo_seed' => true]);

    $this->get('/api/ops/setup?token='.urlencode(OPS_TOKEN))->assertOk()->assertSee('OK');
    expect(User::query()->where('email', 'empresa@example.es')->exists())->toBeTrue();
    $count = User::query()->count();

    // A second visit leaves the data alone.
    $this->get('/api/ops/setup', ['X-Ops-Token' => OPS_TOKEN])->assertOk();
    expect(User::query()->count())->toBe($count);
});

it('never loads the demo in production', function () {
    config(['services.ops.token' => OPS_TOKEN, 'services.ops.demo_seed' => true]);
    app()->detectEnvironment(fn () => 'production');

    $this->get('/api/ops/setup?reset=1&token='.urlencode(OPS_TOKEN))->assertOk();
    expect(User::query()->count())->toBe(0);
});
