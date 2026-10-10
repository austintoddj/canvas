<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Unsplash photo URLs exceed varchar(255). Hosts that call
     * Schema::defaultStringLength(191) make an unqualified string() even
     * shorter, so a 215-character URL fails the revision insert (GH-1537).
     * 4096 matches Post::FEATURED_IMAGE_MAX_LENGTH and ignores that default.
     */
    public function up(): void
    {
        $this->fit('canvas_posts', 4096);
        $this->fit('canvas_post_revisions', 4096);
    }

    public function down(): void
    {
        $this->fit('canvas_posts', 255);
        $this->fit('canvas_post_revisions', 255);
    }

    private function fit(string $tableName, int $length): void
    {
        Schema::table($tableName, function (Blueprint $table) use ($length): void {
            $table->string('featured_image', $length)->nullable()->change();
        });
    }
};
