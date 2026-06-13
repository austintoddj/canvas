<?php

it('canvas migration command', function (): void {
    $this->artisan('canvas:migrate')
        ->assertExitCode(0)
        ->expectsOutput('Migration complete.');
});
