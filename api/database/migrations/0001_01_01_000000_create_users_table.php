<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone', 32)->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            // One account, one side of one platform: worker or employer
            // (Empleo), client or provider (Obras), or admin. The two
            // platforms never share an account.
            $table->string('role', 16)->index();
            $table->string('locale', 5)->default('es');
            // INE province code ("28" Madrid), config/provinces.php.
            $table->string('province', 2)->nullable()->index();
            $table->string('city', 120)->nullable();
            // Employers: direct-contact credits. Providers: lead credits.
            // The ledger (credit_movements) is the truth; this is its sum.
            $table->unsignedInteger('credits')->default(0);
            // Employers: the 30-day company pass unlocks every offer.
            $table->timestamp('pass_until')->nullable();
            $table->timestamp('blocked_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
