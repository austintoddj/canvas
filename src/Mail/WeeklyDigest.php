<?php

namespace Canvas\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WeeklyDigest extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Data to pass to the email.
     *
     * @var array
     */
    public $data;

    /**
     * Create a new message instance.
     *
     * @param  array  $data
     * @return void
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $subject = sprintf('%s: %s - %s',
            trans('canvas::app.stats_for_your_posts', [], $this->data['locale']),
            $this->data['startDate'],
            $this->data['endDate']
        );

        return $this->subject($subject)
                    ->from(config('mail.from.address'), config('mail.from.name'))
                    ->markdown('canvas::mail.digest');
    }
}
