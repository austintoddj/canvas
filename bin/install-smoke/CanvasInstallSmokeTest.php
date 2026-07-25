<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Runs inside a real Laravel host after bin/install-smoke has required Canvas.
 * Uses RefreshDatabase so the suite is self-contained (does not depend on the
 * CLI-seeded smoke user). The shell script separately asserts canvas:install
 * and canvas:make-admin against the file SQLite database.
 */
class CanvasInstallSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_published_config_and_canvas_tables_exist(): void
    {
        $this->assertFileExists(config_path('canvas.php'));
        $this->assertTrue(Schema::hasTable('canvas_posts'));
        $this->assertTrue(Schema::hasTable('canvas_users'));
        $this->assertTrue(Schema::hasTable('canvas_tags'));
        $this->assertTrue(Schema::hasTable('canvas_topics'));
        $this->assertTrue(Schema::hasTable('canvas_media'));
        $this->assertTrue(Schema::hasTable('canvas_settings'));
    }

    public function test_admin_can_load_shell_list_and_publish_a_post(): void
    {
        $user = User::factory()->create([
            'name' => 'Smoke Admin',
            'email' => 'feature-smoke@example.com',
        ]);

        CanvasUser::query()->create([
            'user_id' => $user->id,
            'role' => Role::Admin,
        ]);

        $this->actingAs($user)
            ->get('/canvas')
            ->assertOk()
            ->assertSee('id="canvas"', false)
            ->assertSee('window.Canvas', false);

        $this->actingAs($user)
            ->getJson('/canvas/api/posts')
            ->assertOk()
            ->assertJsonStructure([
                'posts',
                'draftCount',
                'publishedCount',
            ]);

        $id = (string) Str::uuid();

        $this->actingAs($user)
            ->postJson("/canvas/api/posts/{$id}", [
                'title' => 'Install smoke post',
                'slug' => 'install-smoke-post',
                'summary' => null,
                'body' => '<p>Hello from install smoke</p>',
                'published_at' => now()->subMinute()->toIso8601String(),
            ])
            ->assertSuccessful()
            ->assertJsonPath('id', $id)
            ->assertJsonPath('title', 'Install smoke post')
            ->assertJsonPath('slug', 'install-smoke-post');

        $this->assertDatabaseHas('canvas_posts', [
            'id' => $id,
            'slug' => 'install-smoke-post',
            'user_id' => $user->id,
        ]);

        $post = Post::query()->findOrFail($id);
        $this->assertNotNull($post->published_at);

        $this->actingAs($user)
            ->getJson('/canvas/api/posts?type=published')
            ->assertOk()
            ->assertJsonFragment(['id' => $id]);
    }

    public function test_guest_is_blocked_from_canvas(): void
    {
        $this->get('/canvas')->assertRedirect('/login');

        // Laravel 12 often returns 401 for JSON; Laravel 13 may redirect the
        // session guard even when Accept is application/json.
        $api = $this->getJson('/canvas/api/posts');
        $this->assertFalse($api->isSuccessful(), 'Guest must not access the Canvas API');
        $this->assertContains($api->status(), [401, 302, 403]);
    }
}
