<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canvas_post_translations', function (Blueprint $table): void {
            $table->id();
            $table->uuid('post_id');
            $table->string('locale', 85);
            $table->string('title')->nullable();
            $table->text('summary')->nullable();
            $table->longText('body')->nullable();
            $table->json('meta')->nullable();
            $table->dateTime('published_at')->nullable()->index();
            $table->dateTime('published_notified_at')->nullable()->index();
            $table->json('pending')->nullable();
            $table->timestamps();
            $table->unique(['post_id', 'locale']);
            $table->foreign('post_id')->references('id')->on('canvas_posts')->cascadeOnDelete();
        });

        Schema::table('canvas_post_revisions', function (Blueprint $table): void {
            $table->string('locale', 85)->nullable();
            $table->index(['post_id', 'locale', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('canvas_post_revisions', function (Blueprint $table): void {
            $table->dropIndex(['post_id', 'locale', 'created_at']);
            $table->dropColumn('locale');
        });
        Schema::dropIfExists('canvas_post_translations');
    }
};
