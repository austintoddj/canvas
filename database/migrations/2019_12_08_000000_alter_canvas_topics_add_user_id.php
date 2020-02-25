<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AlterCanvasTopicsAddUserId extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('canvas_topics', function (Blueprint $table) {
            $table->string('user_id')->after('name')->default(false)->index();
            $table->dropUnique('canvas_topics_slug_unique');
            $table->unique(['slug', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('canvas_topics', function (Blueprint $table) {
            $table->dropUnique('canvas_topics_slug_user_id_unique');
            $table->unique('slug');
            $table->dropColumn('user_id');
        });
    }
}
