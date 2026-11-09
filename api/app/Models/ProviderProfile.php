<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderProfile extends Model
{
    protected $fillable = ['company_name', 'cif', 'categories', 'provinces', 'description', 'founded_year', 'website', 'listed'];

    protected function casts(): array
    {
        return [
            'categories' => 'array',
            'provinces' => 'array',
            'listed' => 'boolean',
            'founded_year' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
