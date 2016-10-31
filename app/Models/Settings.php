<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Settings extends Model
{
    /**
     * The database table used by the model.
     *
     * @var string
     */
    protected $table = 'settings';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = ['id', 'setting_name', 'setting_value'];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the value of the Blog Title.
     *
     * return @string
     */
    public static function blogTitle()
    {
        return self::getByName('blog_title');
    }

    /**
     * Get the value of the Blog Subtitle.
     *
     * return @string
     */
    public static function blogSubTitle()
    {
        return self::getByName('blog_subtitle');
    }

    /**
     * Get the value of the Blog Description.
     *
     * return @string
     */
    public static function blogDescription()
    {
        return self::getByName('blog_description');
    }

    /**
     * Get the value of the Blog SEO.
     *
     * return @string
     */
    public static function blogSeo()
    {
        return self::getByName('blog_seo');
    }

    /**
     * Get the value of the Blog SEO.
     *
     * return @string
     */
    public static function blogAuthor()
    {
        return self::getByName('blog_author');
    }

     /**
      * Get the current Canvas application version.
      *
      * return @string
      */
     public static function canvasVersion()
     {
         return self::getByName('canvas_version');
     }

    /**
     * Get the latest release of Canvas.
     *
     * return @string
     */
    public static function latestRelease()
    {
        return self::getByName('latest_release');
    }

    /**
     * Get the value of the Disqus shortname.
     *
     * return @string
     */
    public static function disqus()
    {
        return self::getByName('disqus_name');
    }

    /**
     * Get the value of the Google Analytics Tracking ID.
     *
     * return @string
     */
    public static function gaId()
    {
        return self::getByName('ga_id');
    }

    /**
     * Get the value settings by name.
     *
     * @param string $settingName
     * @return string
     */
    public static function getByName($settingName)
    {
        return self::where('setting_name', $settingName)->pluck('setting_value')->first();
    }

    /**
     * Get the Twitter card type.
     *
     * May be either of 'summary', 'summary_large_image' or 'none'
     *
     * return @string
     */
    public static function twitterCardType()
    {
        return $twitterCardType = self::where('setting_name', 'twitter_card_type')->pluck('setting_value')->first();
    }
}
