<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One line of the credit ledger. Written once, never edited. */
class CreditMovement extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['user_id', 'delta', 'reason', 'order_id', 'reference'];

    protected function casts(): array
    {
        return ['delta' => 'integer'];
    }
}
