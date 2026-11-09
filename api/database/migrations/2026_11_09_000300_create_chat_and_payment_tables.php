<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A chat exists only once the paying side has unlocked it: an employer
        // with a worker (an applicant, or a directory contact), or a provider
        // with a client (an unlocked request). `opener_id` is always the side
        // that paid, `member_id` the other.
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            // empleo | obras
            $table->string('platform', 8)->index();
            $table->foreignId('opener_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('job_post_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('last_message_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['opener_id', 'member_id', 'platform']);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['conversation_id', 'id']);
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // config/catalog.php product key
            $table->string('product', 32);
            $table->foreignId('job_post_id')->nullable()->constrained()->nullOnDelete();
            // Cents, VAT included (base + IVA kept for the invoice).
            $table->unsignedInteger('amount_c');
            $table->unsignedInteger('base_c');
            $table->unsignedInteger('vat_c');
            $table->string('currency', 3)->default('EUR');
            // pending | paid | cancelled
            $table->string('status', 10)->default('pending')->index();
            // stripe | simulated | manual
            $table->string('method', 10)->default('stripe');
            $table->string('stripe_session_id')->nullable()->unique();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        // Every credit in or out, never edited: the balance on users.credits
        // is its sum.
        Schema::create('credit_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('delta');
            // purchase | contact | unlock | grant
            $table->string('reason', 16);
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reference', 64)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_movements');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
    }
};
