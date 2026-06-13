<?php

use Canvas\Mail\ResetPassword;
use Illuminate\Support\Str;

it('can be instantiated', function (): void {
    $token = Str::random(60);

    $mailable = new ResetPassword($token);

    $this->assertInstanceOf(ResetPassword::class, $mailable->build());
});
