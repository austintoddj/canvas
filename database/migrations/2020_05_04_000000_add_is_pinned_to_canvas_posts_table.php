<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIsPinnedToCanvasPostsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('canvas_posts', function (Blueprint $table) {
            $table->boolean('is_pinned')->default(false)->after('featured_image_caption');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('canvas_posts', function (Blueprint $table) {
            $table->dropColumn('is_pinned');
        });
    }
}
