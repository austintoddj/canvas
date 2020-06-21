function page(path) {
    return require(`./screens/${path}`).default
}

export default [
    { path: '/', redirect: '/stats' },
    {
        path: '/stats',
        name: 'stats',
        component: page('stats/StatsIndex'),
    },
    {
        path: '/stats/:id',
        name: 'stats-show',
        component: page('stats/StatsShow'),
    },
    {
        path: '/posts',
        name: 'posts',
        component: page('posts/PostIndex'),
    },
    {
        path: '/posts/create',
        name: 'posts-create',
        component: page('posts/PostEdit'),
    },
    {
        path: '/posts/:id/edit',
        name: 'posts-edit',
        component: page('posts/PostEdit'),
    },
    {
        path: '/tags',
        name: 'tags',
        component: page('tags/TagsIndex'),
    },
    {
        path: '/tags/create',
        name: 'tags-create',
        component: page('tags/TagsEdit'),
    },
    {
        path: '/tags/:id/edit',
        name: 'tags-edit',
        component: page('tags/TagsEdit'),
    },
    {
        path: '/topics',
        name: 'topics',
        component: page('topics/TopicsIndex'),
    },
    {
        path: '/topics/create',
        name: 'topics-create',
        component: page('topics/TopicsEdit'),
    },
    {
        path: '/topics/:id/edit',
        name: 'topics-edit',
        component: page('topics/TopicsEdit'),
    },
    {
        path: '/settings',
        name: 'settings-show',
        component: page('settings/SettingsShow'),
    },
    {
        path: '*',
        name: 'catch-all',
        redirect: '/stats',
    },
]
