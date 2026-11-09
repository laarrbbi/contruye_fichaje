<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * One account is one side of one platform. Empleo: `worker` or `employer`.
 * Obras: `client` or `provider`. The two platforms never share an account.
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const WORKER = 'worker';

    public const EMPLOYER = 'employer';

    public const CLIENT = 'client';

    public const PROVIDER = 'provider';

    public const ADMIN = 'admin';

    /** The roles anyone can sign up as, by platform. */
    public const SIGNUP_ROLES = [self::WORKER, self::EMPLOYER, self::CLIENT, self::PROVIDER];

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'locale',
        'province',
        'city',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'pass_until' => 'datetime',
            'blocked_at' => 'datetime',
            'credits' => 'integer',
            'password' => 'hashed',
        ];
    }

    public function platform(): ?string
    {
        return match ($this->role) {
            self::WORKER, self::EMPLOYER => 'empleo',
            self::CLIENT, self::PROVIDER => 'obras',
            default => null,
        };
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ADMIN;
    }

    public function hasActivePass(): bool
    {
        return $this->pass_until !== null && $this->pass_until->isFuture();
    }

    public function workerProfile(): HasOne
    {
        return $this->hasOne(WorkerProfile::class);
    }

    public function employerProfile(): HasOne
    {
        return $this->hasOne(EmployerProfile::class);
    }

    public function providerProfile(): HasOne
    {
        return $this->hasOne(ProviderProfile::class);
    }

    public function jobPosts(): HasMany
    {
        return $this->hasMany(JobPost::class, 'employer_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class, 'worker_id');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'client_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** "Javier Morales" → "Javier M.": how a locked profile is shown. */
    public function shortName(): string
    {
        $words = preg_split('/\s+/u', trim($this->name)) ?: [];
        if (count($words) < 2) {
            return $this->name;
        }

        return $words[0].' '.mb_strtoupper(mb_substr($words[count($words) - 1], 0, 1)).'.';
    }
}
