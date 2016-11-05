<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Settings;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class CreateUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:create 
                            {--A|admin : Whether the user should be of type admin }';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Creates a new user for this application.';

    /**
     * rules for email validation.
     * @var [String]
     */
    protected $emailRules = ['email' => 'unique:users,email'];

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $user_type = $this->getUserType();

        $email = $this->ask($user_type.' email address');
        $this->validateEmailAddress($email);

        $password = $this->ask($user_type.' password');
        $firstName = $this->ask($user_type.'first name');
        $lastName = $this->ask($user_type.' last name');

        $this->createUser($email, $password, $firstName, $lastName);
        $this->comment('Saving '.$user_type.' information...');
        $this->line(PHP_EOL.'<info>✔</info> Success! New '.$user_type.' has been created.');
    }
    /**
     * validates email address.
     * @param  [String] $email
     * @return [String]       
     */
    private function validateEmailAddress($email)
    {
        $validator = Validator::make(['email' => $email], $this->emailRules);
        
        if ($validator->fails()) {
            $this->error('Sorry! That email already exists in the system.');
            $this->comment('Please run <info>canvas:coauthor</info> again.');
            die();
        }
    }

    /**
     * creates a new user.
     * @param  [String] $email 
     * @param  [String] $password
     * @param  [String] $firstName
     * @param  [String] $lastName
     * @return [String]
     */
    private function createUser($email, $password, $firstName, $lastName)
    {
        $user = User::create([
            'email' => $email,
            'password' => bcrypt($password),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'display_name' => $firstName.' '.$lastName
        ]);

        $this->setBlogAuthor($user->display_name);
    }

    /**
     * sets the author/the authors of this blog.
     * @param  [String] $blogAuthor
     * @return
     */
    private function setBlogAuthor($blogAuthor) {
        $blogAuthorSetting = Settings::whereSettingName('blog_author');

        if ($blogAuthorSetting->count() == 1)
        {
            return $this->updateAuthorSetting($blogAuthorSetting->first(), $blogAuthor);
        }

        return $this->createAuthorSetting($blogAuthor);
    }

    /**
     * creates author settings with the current owner of the blog as author.
     * @return [Settings]
     */
    private function createAuthorSetting($blogAuthor)
    {
        return Settings::create([
            'setting_name' => 'blog_author',
            'setting_value' => $blogAuthor,
        ]);
    }

    /**
     * updates author setting to include the coauthor.
     * @param  [String] $blogAuthorSetting
     * @param  [String] $coAuthor
     * @return [Settings]
     */
    private function updateAuthorSetting($blogAuthorSetting, $coAuthor)
    {
        $blogAuthorSetting->setting_name = 'blog_author';
        $blogAuthorSetting->setting_value = $blogAuthorSetting->setting_value.' and '.$coAuthor;
        return $blogAuthorSetting->save();
    }

    /**
     * gets the type of the user to create.
     * @return [Boolean] isAdmin
     */
    private function getUserType()
    {
        return $this->option('admin') ? 'Admin' : 'Co-Author';
    }
}
