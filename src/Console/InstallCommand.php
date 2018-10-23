<?php

namespace Canvas\Console;

use Illuminate\Console\Command;

class InstallCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'canvas:install';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Install all of the Canvas resources';

    /**
     * Execute the console command.
     *
     * @return void
     */
    public function handle()
    {
        $this->comment('Publishing Canvas Assets...');
        $this->callSilent('vendor:publish', ['--tag' => 'canvas-assets']);

        $this->comment('Publishing Canvas Configuration...');
        $this->callSilent('vendor:publish', ['--tag' => 'canvas-config']);

        $this->info('Canvas scaffolding installed successfully.');
    }
}
