import { createBrowserRouter } from 'react-router-dom';

import Page, {
    CalendarIndex,
    Dashboard,
    MediaIndex,
    MediaShow,
    NotFound,
    OrganizeIndex,
    PostsEditor,
    PostsIndex,
    PostsStats,
    IntegrationsIndex,
    UsersIndex,
} from '@/components/Page';
import { RequirePermission } from '@/components/RequirePermission';
import { RouteError } from '@/components/RouteError';
import Layout from '@/layouts/Layout';

export const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <Layout />,
            errorElement: <RouteError />,
            children: [
                { index: true, element: <Page component={Dashboard} /> },
                { path: 'posts', element: <Page component={PostsIndex} /> },
                { path: 'posts/new', element: <Page component={PostsEditor} /> },
                { path: 'posts/:id/stats', element: <Page component={PostsStats} /> },
                { path: 'posts/:id', element: <Page component={PostsEditor} /> },
                { path: 'calendar', element: <Page component={CalendarIndex} /> },
                { path: 'media', element: <Page component={MediaIndex} /> },
                { path: 'media/:id', element: <Page component={MediaShow} /> },
                {
                    path: 'organize',
                    element: (
                        <RequirePermission permission="canManageTaxonomy">
                            <Page component={OrganizeIndex} />
                        </RequirePermission>
                    ),
                },
                {
                    path: 'users',
                    element: (
                        <RequirePermission permission="canManageUsers">
                            <Page component={UsersIndex} />
                        </RequirePermission>
                    ),
                },
                {
                    path: 'integrations',
                    element: (
                        <RequirePermission permission="canManageIntegrations">
                            <Page component={IntegrationsIndex} />
                        </RequirePermission>
                    ),
                },
                { path: '*', element: <Page component={NotFound} /> },
            ],
        },
    ],
    {
        basename: window.Canvas?.path ?? '/canvas',
    }
);
