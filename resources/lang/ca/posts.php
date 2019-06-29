<?php

return [

    'header'  => 'Posts',
    'empty'   => [
        'description' => 'No posts were found, start by',
        'action'      => 'adding a new post',
    ],
    'search'  => [
        'input' => 'Search',
        'empty' => 'No posts matched the given search criteria.',
    ],
    'details' => [
        'published' => 'Published',
        'draft'     => 'Draft',
        'updated'   => 'Updated',
    ],
    'forms'   => [
        'editor'   => [
            'title'  => 'Title',
            'body'   => 'Tell your story...',
            'link'   => 'Paste or type a link...',
            'html'   => [
                'label'       => 'Embed HTML',
                'placeholder' => 'Paste your HTML here',
            ],
            'images' => [
                'featured' => [
                    'title'       => 'Featured Image Caption',
                    'placeholder' => 'Add a caption for your image',
                ],
                'picker'   => [
                    'greeting'    => 'Please',
                    'action'      => 'upload',
                    'item'        => 'an image',
                    'operator'    => 'or',
                    'unsplash'    => 'search Unsplash',
                    'key'         => 'Please configure your Unsplash API Key.',
                    'placeholder' => 'Search free high-resolution photos',
                    'clear'       => [
                        'action'      => 'Remove',
                        'description' => 'the selected image',
                    ],
                    'caption'     => [
                        'by' => 'Photo by',
                        'on' => 'on',
                    ],
                    'search'      => [
                        'empty' => 'We couldn\'t find any matches.',
                    ],
                    'uploader'    => [
                        'label'   => 'Add image',
                        'caption' => [
                            'placeholder' => 'Type caption for image (optional)',
                        ],
                        'layout'  => [
                            'default' => 'Default layout',
                            'wide'    => 'Wide image',
                        ],
                    ],
                ],
            ],
        ],
        'image'    => [
            'header' => 'Featured image',
        ],
        'publish'  => [
            'header'  => 'Publish date (m/d/y h:m)',
            'subtext' => [
                'details'  => 'Post scheduling uses a 24-hour time format and is utilizing the',
                'timezone' => 'timezone',
            ],
        ],
        'seo'      => [
            'header'    => 'SEO & Social',
            'meta'      => 'Meta Description',
            'facebook'  => [
                'title'       => [
                    'label'       => 'Facebook Card Title',
                    'placeholder' => 'Title in Facebook Card',
                ],
                'description' => [
                    'label'       => 'Facebook Card Description',
                    'placeholder' => 'Description in Facebook Card',
                ],
            ],
            'twitter'   => [
                'title'       => [
                    'label'       => 'Twitter Card Title',
                    'placeholder' => 'Title in Twitter Card',
                ],
                'description' => [
                    'label'       => 'Twitter Card Description',
                    'placeholder' => 'Description in Twitter Card',
                ],
            ],
            'canonical' => [
                'label'       => 'Canonical',
                'placeholder' => 'Canonical URL of original source',
            ],
        ],
        'settings' => [
            'header'  => 'General settings',
            'slug'    => [
                'label'       => 'Slug',
                'placeholder' => 'a-unique-slug',
            ],
            'summary' => [
                'label'       => 'Summary',
                'placeholder' => 'A descriptive summary..',
            ],
            'topic'   => [
                'label' => 'Topic',
            ],
            'tags'    => [
                'label' => 'Tags',
            ],
        ],
    ],
    'delete'  => [
        'header'  => 'Delete',
        'warning' => 'Deleted posts are gone forever. Are you sure?',
    ],

];
