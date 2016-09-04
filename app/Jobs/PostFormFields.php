<?php

namespace App\Jobs;

use App\Models\Post;
use App\Models\Tag;
use Carbon\Carbon;
use Illuminate\Queue\SerializesModels;

/**
 * Class PostFormField.
 */
class PostFormFields
{
    use SerializesModels;

    /**
     * The id (if any) of the Post row.
     *
     * @var int
     */
    protected $id;
    /**
     * List of fields and default value for each field.
     *
     * @var array
     */
    protected $fieldList = [
        'title' => '',
        'slug' => '',
        'subtitle' => '',
        'page_image' => '',
        'content' => '',
        'meta_description' => '',
        'is_draft' => '0',
        'publish_date' => '',
        'publish_time' => '',
        'published_at' => '',
        'updated_at' => '',
        'layout' => 'frontend.blog.post',
        'tags' => [],
    ];

    /**
     * Create a new command instance.
     *
     * @param int $id
     */
    public function __construct($id = null)
    {
        $this->id = $id;
    }

    /**
     * Execute the command.
     *
     * @return array of fieldnames => values
     */
    public function handle()
    {
        $fields = $this->fieldList;
        if ($this->id) {
            $fields = $this->fieldsFromModel($this->id, $fields);
        } else {
            $when = Carbon::now()->addHour();
            $fields['publish_date'] = $when->format('M-j-Y');
            $fields['publish_time'] = $when->format('g:i A');
        }
        foreach ($fields as $fieldName => $fieldValue) {
            $fields[$fieldName] = old($fieldName, $fieldValue);
        }

        return array_merge(
            $fields,
            ['allTags' => Tag::pluck('tag')->all()]
        );
    }

    /**
     * Return the field values from the model.
     *
     * @param int $id
     * @param array $fields
     * @return array
     */
    protected function fieldsFromModel($id, array $fields)
    {
        $post = Post::findOrFail($id);
        $fieldNames = array_keys(array_except($fields, ['tags']));
        $fields = ['id' => $id];
        foreach ($fieldNames as $field) {
            $fields[$field] = $post->{$field};
        }
        $fields['tags'] = $post->tags()->pluck('tag')->all();

        return $fields;
    }
}
