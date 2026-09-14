<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canvas_webhook_deliveries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('event')->index();
            $table->string('url');
            $table->string('status')->index();
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->json('payload')->nullable();
            $table->text('response_body')->nullable();
            $table->string('error_message')->nullable();
            $table->uuid('post_id')->nullable()->index();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('canvas_webhook_deliveries');
    }
};
