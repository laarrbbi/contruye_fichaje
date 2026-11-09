<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkerProfile extends Model
{
    protected $fillable = [
        'trade', 'other_trades', 'years_experience', 'headline', 'bio', 'availability',
        'has_tpc', 'prl_training', 'driving_license', 'own_vehicle', 'work_permit',
        'willing_to_travel', 'languages', 'visible',
    ];

    protected function casts(): array
    {
        return [
            'other_trades' => 'array',
            'languages' => 'array',
            'years_experience' => 'integer',
            'has_tpc' => 'boolean',
            'driving_license' => 'boolean',
            'own_vehicle' => 'boolean',
            'work_permit' => 'boolean',
            'willing_to_travel' => 'boolean',
            'visible' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
