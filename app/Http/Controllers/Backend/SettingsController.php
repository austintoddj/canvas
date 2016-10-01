<?php

namespace App\Http\Controllers\Backend;

use Session;
use App\Models\Settings;
use App\Http\Controllers\Controller;
use App\Http\Requests\SettingsUpdateRequest;

class SettingsController extends Controller
{
    /**
     * Display the settings page.
     *
     * @return \Illuminate\View\View
     */
    public function index()
    {
        $data = [
            'blogTitle' => Settings::blogTitle(),
            'blogSubtitle' => Settings::blogSubTitle(),
            'blogDescription' => Settings::blogDescription(),
            'blogSeo' => Settings::blogSeo(),
            'blogAuthor' => Settings::blogAuthor(),
            'disqus' => Settings::disqus(),
            'analytics' => Settings::gaId(),
            'twitterCardType' => Settings::twitterCardType(),
            'url' => $_SERVER['HTTP_HOST'],
            'ip' => $_SERVER['REMOTE_ADDR'],
            'timezone' => env('APP_TIMEZONE'),
            'php_version' => phpversion(),
            'php_memory_limit' => ini_get('memory_limit'),
            'php_time_limit' => ini_get('max_execution_time'),
            'db_connection' => strtoupper(env('DB_CONNECTION')),
            'web_server' => $_SERVER['SERVER_SOFTWARE'],
            'last_index' => date('Y-m-d H:i:s', file_exists(storage_path('posts.index')) ? filemtime(storage_path('posts.index')) : false),
            'version' => (!empty(Settings::canvasVersion())) ? Settings::canvasVersion() : 'Older than 2.1.7',
        ];

        return view('backend.settings.index', compact('data'));
    }

    /**
     * Store the site configuration options. This is currently accomplished
     * by finding the specific option, deleting it, and then inserting
     * the new option.
     *
     * @param SettingsUpdateRequest $request
     *
     * @return \Illuminate\View\View
     */
    public function store(SettingsUpdateRequest $request)
    {
        $blogTitle = Settings::where('setting_name', 'blog_title')->first();
        $blogTitle->setting_name = 'blog_title';
        $blogTitle->setting_value = $request->toArray()['blog_title'];
        $blogTitle->update();

        $blogSubtitle = Settings::where('setting_name', 'blog_subtitle')->first();
        $blogSubtitle->setting_name = 'blog_subtitle';
        $blogSubtitle->setting_value = $request->toArray()['blog_subtitle'];
        $blogSubtitle->update();

        $blogDescription = Settings::where('setting_name', 'blog_description')->first();
        $blogDescription->setting_name = 'blog_description';
        $blogDescription->setting_value = $request->toArray()['blog_description'];
        $blogDescription->update();

        $blogSeo = Settings::where('setting_name', 'blog_seo')->first();
        $blogSeo->setting_name = 'blog_seo';
        $blogSeo->setting_value = $request->toArray()['blog_seo'];
        $blogSeo->update();

        $blogAuthor = Settings::where('setting_name', 'blog_author')->first();
        $blogAuthor->setting_name = 'blog_author';
        $blogAuthor->setting_value = $request->toArray()['blog_author'];
        $blogAuthor->update();

        $disqusName = Settings::where('setting_name', 'disqus_name')->first();
        $disqusName->setting_name = 'disqus_name';
        $disqusName->setting_value = $request->toArray()['disqus_name'];
        $disqusName->update();

        $gaId = Settings::where('setting_name', 'ga_id')->first();
        $gaId->setting_name = 'ga_id';
        $gaId->setting_value = $request->toArray()['ga_id'];
        $gaId->update();

        $twitterCardType = Settings::where('setting_name', 'twitter_card_type')->first();
        $twitterCardType->setting_name = 'twitter_card_type';
        $twitterCardType->setting_value = $request->toArray()['twitter_card_type'];
        $twitterCardType->update();


        Session::set('_update-settings', trans('messages.save_settings_success'));

        return redirect('admin/settings');
    }
}
