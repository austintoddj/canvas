<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AlterCanvasPostsPublishedAtDefaultValue extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('canvas_posts', function (Blueprint $table) {
            $table->dateTime('published_at')->nullable()->default(null)->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // To truly reverse the migration above we would need to add ->nullable(false)
        // This is omitted however because MySQL throws an exception if null values exist
        Schema::table('canvas_posts', function (Blueprint $table) {
            $table->dateTime('published_at')->default('2018-10-12 00:00:00')->change();
        });
    }
}
