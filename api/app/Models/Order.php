<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'product', 'job_post_id', 'amount_c', 'base_c', 'vat_c', 'currency',
        'status', 'method', 'stripe_session_id', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_c' => 'integer',
            'base_c' => 'integer',
            'vat_c' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function jobPost(): BelongsTo
    {
        return $this->belongsTo(JobPost::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
