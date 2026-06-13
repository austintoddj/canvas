<?php

it('runs the canvas migrate command', function (): void {
    $this->artisan('canvas:migrate')
        ->assertExitCode(0)
        ->expectsOutput('Migration complete.');
});
