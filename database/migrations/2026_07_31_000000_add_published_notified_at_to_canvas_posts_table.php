<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('canvas_posts', function (Blueprint $table) {
            $table->dateTime('published_notified_at')->nullable()->after('published_at');
            $table->index(
                ['published_notified_at', 'published_at'],
                'canvas_posts_published_notified_index'
            );
        });

        // Existing live posts must not re-announce on the first scheduler tick.
        DB::table('canvas_posts')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now()->format('Y-m-d H:i:s'))
            ->whereNull('published_notified_at')
            ->update([
                'published_notified_at' => DB::raw('published_at'),
            ]);
    }

    public function down(): void
    {
        Schema::table('canvas_posts', function (Blueprint $table) {
            $table->dropIndex('canvas_posts_published_notified_index');
            $table->dropColumn('published_notified_at');
        });
    }
};
