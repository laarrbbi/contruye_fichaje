<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Obras: people who want a construction company, and the companies that do
 * the work. Kept apart from Empleo: other accounts, other tables, other pages.
 *
 * A person describes the work for free. Companies of that trade and area see
 * the request without the person's contact; one that wants it spends credits
 * to unlock it, which opens the chat and shows the contact. A request is sold
 * to a few companies at most (config/obras.php, max_unlocks), so the person
 * gets a handful of quotes, not a flood of calls.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('company_name', 160);
            $table->string('cif', 16)->nullable();
            // config/obras.php categories
            $table->json('categories');
            // INE province codes the company works in.
            $table->json('provinces');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('founded_year')->nullable();
            $table->string('website', 255)->nullable();
            // Shown in the public directory.
            $table->boolean('listed')->default(true);
            $table->timestamps();
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->string('title', 140);
            $table->string('category', 32)->index();
            $table->text('description');
            $table->string('province', 2)->index();
            $table->string('city', 120);
            $table->string('postal_code', 5)->nullable();
            // piso | casa | local | nave | edificio | solar
            $table->string('property_type', 10);
            // config/obras.php budgets
            $table->string('budget', 12);
            // urgente | 1_3_meses | 3_6_meses | flexible
            $table->string('timing', 12);
            // open | closed
            $table->string('status', 8)->default('open')->index();
            $table->unsignedTinyInteger('unlocks_count')->default(0);
            $table->timestamp('expires_at')->index();
            $table->timestamps();
        });

        Schema::create('project_unlocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('provider_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedSmallInteger('credits');
            $table->timestamps();
            $table->unique(['project_id', 'provider_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_unlocks');
        Schema::dropIfExists('projects');
        Schema::dropIfExists('provider_profiles');
    }
};
