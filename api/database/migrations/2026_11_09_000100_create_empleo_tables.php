<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Empleo: construction workers and the companies that hire them.
 *
 * The JobToday model: a company publishes an offer for free, workers apply in
 * one tap, the company sees who applied (a summary, no contact). To open the
 * chat with them, and see their phone and e-mail, the offer must be activated
 * (paid) or the company must hold a pass. A company can also contact a worker
 * found in the directory directly, with a contact credit.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('worker_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            // config/trades.php
            $table->string('trade', 40)->index();
            $table->json('other_trades')->nullable();
            $table->unsignedTinyInteger('years_experience')->default(0);
            $table->string('headline', 120)->nullable();
            $table->text('bio')->nullable();
            // immediate | two_weeks | month | employed
            $table->string('availability', 16)->default('immediate');
            // Tarjeta Profesional de la Construcción (TPC) and PRL training.
            $table->boolean('has_tpc')->default(false);
            $table->string('prl_training', 16)->nullable(); // 20h | 60h | 300h | none
            $table->boolean('driving_license')->default(false);
            $table->boolean('own_vehicle')->default(false);
            $table->boolean('work_permit')->default(true);
            $table->boolean('willing_to_travel')->default(false);
            $table->json('languages')->nullable();
            // Companies find the worker in the directory only if they agree.
            $table->boolean('visible')->default(true);
            $table->timestamps();
        });

        Schema::create('employer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('company_name', 160);
            $table->string('cif', 16)->nullable();
            // obra_nueva | reformas | obra_civil | instalaciones | ett | otros
            $table->string('sector', 24)->default('obra_nueva');
            // 1-9 | 10-49 | 50-249 | 250+
            $table->string('size', 8)->nullable();
            $table->text('description')->nullable();
            $table->string('website', 255)->nullable();
            $table->timestamps();
        });

        Schema::create('job_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained('users')->cascadeOnDelete();
            $table->string('title', 140);
            $table->string('trade', 40)->index();
            $table->string('province', 2)->index();
            $table->string('city', 120)->nullable();
            // indefinido | fijo_obra | temporal | fijo_discontinuo | autonomo | practicas
            $table->string('contract_type', 20);
            // completa | parcial
            $table->string('workday', 10)->default('completa');
            $table->unsignedInteger('salary_min')->nullable(); // whole euros
            $table->unsignedInteger('salary_max')->nullable();
            // hora | dia | mes | ano
            $table->string('salary_period', 4)->default('mes');
            // inmediata | 15_dias | 1_mes | a_convenir
            $table->string('start', 12)->default('inmediata');
            $table->unsignedSmallInteger('vacancies')->default(1);
            $table->unsignedTinyInteger('experience_min')->default(0);
            $table->text('description');
            $table->text('requirements')->nullable();
            $table->boolean('requires_tpc')->default(false);
            $table->boolean('requires_license')->default(false);
            $table->boolean('accommodation')->default(false);
            // active | closed
            $table->string('status', 10)->default('active')->index();
            // Paid: the chat with every applicant is open until then.
            $table->timestamp('unlocked_until')->nullable();
            // Premium: shown first, with the "Destacada" seal.
            $table->timestamp('featured_until')->nullable()->index();
            $table->timestamp('expires_at')->index();
            $table->unsignedInteger('views')->default(0);
            $table->timestamps();
        });

        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('worker_id')->constrained('users')->cascadeOnDelete();
            $table->string('message', 600)->nullable();
            // new | seen | shortlisted | rejected | hired
            $table->string('status', 12)->default('new')->index();
            $table->timestamps();
            $table->unique(['job_post_id', 'worker_id']);
        });

        // A worker contacted from the directory with a credit: the employer
        // keeps that contact for good.
        Schema::create('worker_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('worker_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['employer_id', 'worker_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('worker_contacts');
        Schema::dropIfExists('applications');
        Schema::dropIfExists('job_posts');
        Schema::dropIfExists('employer_profiles');
        Schema::dropIfExists('worker_profiles');
    }
};
