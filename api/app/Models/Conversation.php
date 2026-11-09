<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A chat between the side that paid (`opener`: an employer or a provider) and
 * the other (`member`: a worker or a client). It exists only once unlocked.
 */
class Conversation extends Model
{
    protected $fillable = ['platform', 'opener_id', 'member_id', 'job_post_id', 'project_id', 'last_message_at'];

    protected function casts(): array
    {
        return ['last_message_at' => 'datetime'];
    }

    public function opener(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opener_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    public function jobPost(): BelongsTo
    {
        return $this->belongsTo(JobPost::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function involves(User $user): bool
    {
        return $this->opener_id === $user->id || $this->member_id === $user->id;
    }

    public function otherParty(User $user): User
    {
        return $this->opener_id === $user->id ? $this->member : $this->opener;
    }
}
