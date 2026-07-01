<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCanvasTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('canvas_posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug');
            $table->string('title');
            $table->text('summary')->nullable();
            $table->text('body')->nullable();
            $table->dateTime('published_at')->nullable();
            $table->string('featured_image')->nullable();
            $table->string('featured_image_caption')->nullable();
            $table->uuid('user_id')->nullable()->index();
            $table->uuid('topic_id')->nullable()->index();
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['slug', 'user_id']);
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('canvas_tags', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug');
            $table->string('name');
            $table->uuid('user_id')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
            $table->index('created_at');
            $table->unique(['slug', 'user_id']);
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('canvas_topics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug');
            $table->string('name');
            $table->uuid('user_id')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
            $table->index('created_at');
            $table->unique(['slug', 'user_id']);
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('canvas_posts_tags', function (Blueprint $table) {
            $table->uuid('post_id');
            $table->uuid('tag_id');
            $table->unique(['post_id', 'tag_id']);
        });

        Schema::create('canvas_views', function (Blueprint $table) {
            $table->increments('id');
            $table->uuid('post_id')->index();
            $table->string('ip')->nullable();
            $table->text('agent')->nullable();
            $table->string('referer')->nullable();
            $table->timestamps();
            $table->index('created_at');
        });

        Schema::create('canvas_visits', function (Blueprint $table) {
            $table->increments('id');
            $table->uuid('post_id');
            $table->string('ip')->nullable();
            $table->text('agent')->nullable();
            $table->string('referer')->nullable();
            $table->timestamps();
        });

        Schema::create('canvas_users', function (Blueprint $table) {
            $table->uuid('user_id')->primary();
            $table->tinyInteger('role');
            $table->string('username')->nullable()->unique();
            $table->text('summary')->nullable();
            $table->string('avatar')->nullable();
            $table->string('website')->nullable();
            $table->json('social')->nullable();
            $table->string('locale')->nullable();
            $table->string('timezone')->nullable();
            $table->string('theme')->nullable();
            $table->boolean('digest')->default(false);
            $table->json('preferences')->nullable();
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('canvas_media', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('path');
            $table->string('filename');
            $table->string('original_name')->nullable();
            $table->string('mime_type');
            $table->unsignedBigInteger('size');
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('alt')->nullable();
            $table->string('caption')->nullable();
            $table->uuid('user_id')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
            $table->index('created_at');
            $table->index('mime_type');
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('canvas_posts_tags');
        Schema::dropIfExists('canvas_views');
        Schema::dropIfExists('canvas_visits');
        Schema::dropIfExists('canvas_media');
        Schema::dropIfExists('canvas_posts');
        Schema::dropIfExists('canvas_tags');
        Schema::dropIfExists('canvas_topics');
        Schema::dropIfExists('canvas_users');
    }
}
