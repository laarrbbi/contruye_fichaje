<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployerProfile extends Model
{
    protected $fillable = ['company_name', 'cif', 'sector', 'size', 'description', 'website'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
