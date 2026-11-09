<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'category', 'description', 'province', 'city', 'postal_code',
        'property_type', 'budget', 'timing', 'status', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'unlocks_count' => 'integer',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function unlocks(): HasMany
    {
        return $this->hasMany(ProjectUnlock::class);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', 'open')->where('expires_at', '>', now());
    }

    public function isOpen(): bool
    {
        return $this->status === 'open' && $this->expires_at->isFuture();
    }

    /** Credits a company spends to unlock this request (config/obras.php). */
    public function cost(): int
    {
        return (int) (config('obras.budgets')[$this->budget] ?? 1);
    }

    public function isFull(): bool
    {
        return $this->unlocks_count >= (int) config('obras.max_unlocks');
    }
}
