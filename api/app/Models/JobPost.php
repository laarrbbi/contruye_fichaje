<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobPost extends Model
{
    use HasFactory;

    public const CONTRACT_TYPES = ['indefinido', 'fijo_obra', 'temporal', 'fijo_discontinuo', 'autonomo', 'practicas'];

    public const WORKDAYS = ['completa', 'parcial'];

    public const SALARY_PERIODS = ['hora', 'dia', 'mes', 'ano'];

    public const STARTS = ['inmediata', '15_dias', '1_mes', 'a_convenir'];

    protected $fillable = [
        'title', 'trade', 'province', 'city', 'contract_type', 'workday', 'salary_min', 'salary_max',
        'salary_period', 'start', 'vacancies', 'experience_min', 'description', 'requirements',
        'requires_tpc', 'requires_license', 'accommodation', 'status', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'salary_min' => 'integer',
            'salary_max' => 'integer',
            'vacancies' => 'integer',
            'experience_min' => 'integer',
            'requires_tpc' => 'boolean',
            'requires_license' => 'boolean',
            'accommodation' => 'boolean',
            'unlocked_until' => 'datetime',
            'featured_until' => 'datetime',
            'expires_at' => 'datetime',
            'views' => 'integer',
        ];
    }

    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /** Published and not expired: what workers see and can apply to. */
    public function scopeLive(Builder $query): Builder
    {
        return $query->where('status', 'active')->where('expires_at', '>', now());
    }

    public function isLive(): bool
    {
        return $this->status === 'active' && $this->expires_at->isFuture();
    }

    public function isFeatured(): bool
    {
        return $this->featured_until !== null && $this->featured_until->isFuture();
    }

    /**
     * The chat with this offer's applicants is open: the offer was paid for,
     * or its company holds a pass.
     */
    public function isUnlocked(): bool
    {
        if ($this->unlocked_until !== null && $this->unlocked_until->isFuture()) {
            return true;
        }

        return $this->employer?->hasActivePass() ?? false;
    }
}
