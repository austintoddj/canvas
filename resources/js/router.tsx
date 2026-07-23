import { createBrowserRouter } from 'react-router-dom';

import Page, {
    Dashboard,
    MediaIndex,
    MediaShow,
    OrganizeIndex,
    PostsEditor,
    PostsIndex,
    PostsStats,
    IntegrationsIndex,
    UsersIndex,
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
                { path: 'organize', element: <Page component={OrganizeIndex} /> },
                { path: 'users', element: <Page component={UsersIndex} /> },
                { path: 'integrations', element: <Page component={IntegrationsIndex} /> },
            ],
        },
    ],
    {
        basename: window.Canvas?.path ?? '/canvas',
    }
);
