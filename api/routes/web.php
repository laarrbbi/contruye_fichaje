<?php

use Illuminate\Support\Facades\Route;

// The API has no pages of its own: its root sends visitors to the app.
Route::get('/', fn () => redirect()->away((string) config('app.frontend_url')));
