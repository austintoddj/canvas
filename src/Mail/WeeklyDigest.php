<?php

declare(strict_types=1);

namespace Canvas\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WeeklyDigest extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  array<int, array<string, mixed>>  $posts
     * @param  array{views: int, visits: int}  $totals
     */
    public function __construct(
        public readonly string $userName,
        public readonly array $posts,
        public readonly array $totals,
        public readonly string $startDate,
        public readonly string $endDate,
        public readonly string $timezone = 'UTC',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('canvas::app.digest.subject', [
                'start' => $this->startDate,
                'end' => $this->endDate,
            ]),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'canvas::mail.digest',
        );
    }
}
