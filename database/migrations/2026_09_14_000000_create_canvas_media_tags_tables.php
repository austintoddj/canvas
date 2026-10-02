<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canvas_media_tags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug');
            $table->foreignId('user_id')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
            $table->unique('slug');
            $table->index('name');
            $table->index('created_at');
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('canvas_media_tag', function (Blueprint $table) {
            $table->uuid('media_id');
            $table->uuid('media_tag_id');
            $table->unique(['media_id', 'media_tag_id']);
            $table->index('media_tag_id');
            $table->foreign('media_id')->references('id')->on('canvas_media')->cascadeOnDelete();
            $table->foreign('media_tag_id')->references('id')->on('canvas_media_tags')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('canvas_media_tag');
        Schema::dropIfExists('canvas_media_tags');
    }
};
