<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkerContact extends Model
{
    protected $fillable = ['employer_id', 'worker_id'];
}
