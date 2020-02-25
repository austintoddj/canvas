export default [
    { path: '/', redirect: '/stats' },
    {
        path: '/stats',
        name: 'stats',
        component: require('./screens/stats/StatsIndex').default,
    },
    {
        path: '/stats/:id',
        name: 'stats-show',
        component: require('./screens/stats/StatsShow').default,
    },
    {
        path: '/posts',
        name: 'posts',
        component: require('./screens/posts/PostIndex').default,
    },
    {
        path: '/posts/create',
        name: 'posts-create',
        component: require('./screens/posts/PostEdit').default,
    },
    {
        path: '/posts/:id/edit',
        name: 'posts-edit',
        component: require('./screens/posts/PostEdit').default,
    },
    {
        path: '/tags',
        name: 'tags',
        component: require('./screens/tags/TagsIndex').default,
    },
    {
        path: '/tags/create',
        name: 'tags-create',
        component: require('./screens/tags/TagsEdit').default,
    },
    {
        path: '/tags/:id/edit',
        name: 'tags-edit',
        component: require('./screens/tags/TagsEdit').default,
    },
    {
        path: '/topics',
        name: 'topics',
        component: require('./screens/topics/TopicsIndex').default,
    },
    {
        path: '/topics/create',
        name: 'topics-create',
        component: require('./screens/topics/TopicsEdit').default,
    },
    {
        path: '/topics/:id/edit',
        name: 'topics-edit',
        component: require('./screens/topics/TopicsEdit').default,
    },
    {
        path: '/settings',
        name: 'settings-show',
        component: require('./screens/settings/SettingsShow').default,
    },
    {
        path: '*',
        name: 'catch-all',
        redirect: '/stats',
    },
]
