<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The name of the users table.
     *
     * @const string
     */
    private const USERS_TABLE = 'canvas_users';

    /**
     * The name of the tags table.
     *
     * @const string
     */
    private const TAGS_TABLE = 'canvas_tags';

    /**
     * The name of the topics table.
     *
     * @const string
     */
    private const TOPICS_TABLE = 'canvas_topics';

    /**
     * The name of the posts table.
     *
     * @const string
     */
    private const POSTS_TABLE = 'canvas_posts';

    /**
     * The name of the posts/tags pivot table.
     *
     * @const string
     */
    private const POSTS_TAGS_TABLE = 'canvas_posts_tags';

    /**
     * The name of the views table.
     *
     * @const string
     */
    private const VIEWS_TABLE = 'canvas_views';

    /**
     * The name of the visits table.
     *
     * @const string
     */
    private const VISITS_TABLE = 'canvas_visits';

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create(self::USERS_TABLE, function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('username')->unique()->nullable();
            $table->string('password');
            $table->text('summary')->nullable();
            $table->string('avatar')->nullable();
            $table->tinyInteger('dark_mode')->nullable();
            $table->tinyInteger('digest')->nullable();
            $table->string('locale')->nullable();
            $table->tinyInteger('role')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create(self::TAGS_TABLE, function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug');
            $table->string('name');
            $table->foreignUuid('user_id')->index()->references('id')->on(self::USERS_TABLE);
            $table->timestamps();
            $table->softDeletes();

            $table->index('created_at');
            $table->unique(['slug', 'user_id']);
        });

        Schema::create(self::TOPICS_TABLE, function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug');
            $table->string('name');
            $table->foreignUuid('user_id')->index()->references('id')->on(self::USERS_TABLE);
            $table->timestamps();
            $table->softDeletes();

            $table->index('created_at');
            $table->unique(['slug', 'user_id']);
        });

        Schema::create(self::POSTS_TABLE, function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug');
            $table->string('title');
            $table->text('summary')->nullable();
            $table->text('body')->nullable();
            $table->dateTime('published_at')->nullable();
            $table->string('featured_image')->nullable();
            $table->string('featured_image_caption')->nullable();
            $table->foreignUuid('user_id')->index()->references('id')->on(self::USERS_TABLE);
            $table->foreignUuid('topic_id')->nullable()->references('id')->on(self::TOPICS_TABLE);
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['slug', 'user_id']);
        });

        Schema::create(self::POSTS_TAGS_TABLE, function (Blueprint $table) {
            $table->foreignUuid('post_id')->index()->references('id')->on(self::POSTS_TABLE);
            $table->foreignUuid('tag_id')->index()->references('id')->on(self::TAGS_TABLE);

            $table->unique(['post_id', 'tag_id']);
        });

        Schema::create(self::VIEWS_TABLE, function (Blueprint $table) {
            $table->increments('id');
            $table->foreignUuid('post_id')->index()->references('id')->on(self::POSTS_TABLE);
            $table->string('ip')->nullable();
            $table->text('agent')->nullable();
            $table->string('referer')->nullable();
            $table->timestamps();

            $table->index('created_at');
        });

        Schema::create(self::VISITS_TABLE, function (Blueprint $table) {
            $table->increments('id');
            $table->foreignUuid('post_id')->references('id')->on(self::POSTS_TABLE);
            $table->string('ip')->nullable();
            $table->text('agent')->nullable();
            $table->string('referer')->nullable();
            $table->timestamps();

            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists(self::USERS_TABLE);
        Schema::dropIfExists(self::TAGS_TABLE);
        Schema::dropIfExists(self::TOPICS_TABLE);
        Schema::dropIfExists(self::POSTS_TABLE);
        Schema::dropIfExists(self::POSTS_TAGS_TABLE);
        Schema::dropIfExists(self::VIEWS_TABLE);
        Schema::dropIfExists(self::VISITS_TABLE);
    }
};
