<?php

declare(strict_types=1);

namespace Canvas\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WeeklyDigest extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public readonly array $posts,
        public readonly array $totals,
        public readonly string $startDate,
        public readonly string $endDate,
        string $locale,
    ) {
        $this->locale = $locale;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: config('mail.from.address'),
            subject: sprintf('%s: %s - %s',
                trans('canvas::app.stats_for_your_posts', [], $this->locale),
                $this->startDate,
                $this->endDate,
            ),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'canvas::mail.digest',
        );
    }
}
