<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Models\WebhookDelivery;
use Illuminate\Console\Command;

class PruneWebhookDeliveriesCommand extends Command
{
    protected $signature = 'canvas:prune-webhook-deliveries
                            {--days=30 : Delete delivery rows older than this many days}';

    protected $description = 'Delete outbound webhook delivery history older than the retention window';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = now()->subDays($days);

        $deleted = WebhookDelivery::query()
            ->where('created_at', '<', $cutoff)
            ->delete();

        $this->info("Deleted {$deleted} webhook delivery row(s) older than {$days} day(s).");

        return self::SUCCESS;
    }
}
