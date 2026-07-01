import { createBrowserRouter } from 'react-router-dom';

import Page, {
    Dashboard,
    MediaIndex,
    MediaShow,
    PostsEditor,
    PostsIndex,
    PostsStats,
    SettingsProfile,
    SettingsUsersIndex,
    SettingsUsersShow,
    TagsEditor,
    TagsIndex,
    TopicsEditor,
    TopicsIndex,
} from '@/components/Page';
import Layout from '@/layouts/Layout';

export const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <Layout />,
            children: [
                { index: true, element: <Page component={Dashboard} /> },
                { path: 'posts', element: <Page component={PostsIndex} /> },
                { path: 'posts/new', element: <Page component={PostsEditor} /> },
                { path: 'posts/:id/stats', element: <Page component={PostsStats} /> },
                { path: 'posts/:id', element: <Page component={PostsEditor} /> },
                { path: 'media', element: <Page component={MediaIndex} /> },
                { path: 'media/:id', element: <Page component={MediaShow} /> },
                { path: 'tags', element: <Page component={TagsIndex} /> },
                { path: 'tags/:id', element: <Page component={TagsEditor} /> },
                { path: 'topics', element: <Page component={TopicsIndex} /> },
                { path: 'topics/:id', element: <Page component={TopicsEditor} /> },
                { path: 'settings', element: <Page component={SettingsProfile} /> },
                { path: 'settings/users', element: <Page component={SettingsUsersIndex} /> },
                { path: 'settings/users/:id', element: <Page component={SettingsUsersShow} /> },
            ],
        },
    ],
    {
        basename: window.Canvas?.path ?? '/canvas',
    }
);
