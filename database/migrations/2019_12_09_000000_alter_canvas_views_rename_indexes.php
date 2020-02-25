<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AlterCanvasViewsRenameIndexes extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('canvas_views', function (Blueprint $table) {
            $table->dropIndex('post_id');
            $table->index('post_id');

            $table->dropIndex('created_at');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('canvas_views', function (Blueprint $table) {
            $table->dropIndex('canvas_views_post_id_index');
            $table->index('post_id', 'post_id');

            $table->dropIndex('canvas_views_created_at_index');
            $table->index('created_at', 'created_at');
        });
    }
}
