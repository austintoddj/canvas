<?php

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;

/*
|--------------------------------------------------------------------------
| Initial User Seed Data
|--------------------------------------------------------------------------
|
| Here you may set the user information details for the application
| administrator. Don't worry, you can always edit these
| details within the application.
|
*/
class UsersTableSeeder extends Seeder
{
    /**
     * Run the User model database seed.
     *
     * @return void
     */
    public function run()
    {
        Model::unguard();

            User::truncate();

            DB::table('users')->insert([
                /*
                |--------------------------------------------------------------------------
                | Summary
                |--------------------------------------------------------------------------
                */
                'bio'           => 'A short description of yourself is a great way for people to get to know you!',

                /*
                |--------------------------------------------------------------------------
                | Basic Information
                |--------------------------------------------------------------------------
                */
                'first_name'    => 'Canvas',
                'last_name'     => 'Administrator',
                'display_name'  => 'Admin',
                'job'           => 'Web Developer',
                'gender'        => 'Male',
                'birthday'      => '2016-06-17',
                'relationship'  => 'Married',

                /*
                |--------------------------------------------------------------------------
                | Contact Information
                |--------------------------------------------------------------------------
                */
                'phone'         => '0001110000',
                'email'         => 'admin@' . seoUrl(config('blog.title')) . '.com',
                'twitter'       => 'canvasj',     # Example: https://twitter.com/user
                'facebook'      => 'canvas',      # Example: https://facebook.com/user
                'github'        => 'canvas',      # Example: https://github.com/user
                'address'       => '1200 Canvas Way',
                'city'          => 'Minneapolis',
                'state'         => 'MN',

                /*
                |--------------------------------------------------------------------------
                | Misc Information
                |--------------------------------------------------------------------------
                */
                'url'           => 'www.' . seoUrl(config('blog.title')) . '.com',
                'password'      => bcrypt('password'),

                /*
                |--------------------------------------------------------------------------
                | Timestamps
                |--------------------------------------------------------------------------
                */
                'created_at'    => Carbon\Carbon::now(),
                'updated_at'    => Carbon\Carbon::now()
            ]);

        Model::reguard();
    }
}
