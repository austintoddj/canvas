import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './layouts/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PostsIndex = lazy(() => import('./pages/Posts/Index'));

function Page({ component: Component }: { component: React.ComponentType }) {
    return (
        <Suspense fallback={null}>
            <Component />
        </Suspense>
    );
}

export const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <Layout />,
            children: [
                { index: true, element: <Page component={Dashboard} /> },
                { path: 'posts', element: <Page component={PostsIndex} /> },
            ],
        },
    ],
    {
        basename: (window as any).Canvas?.path ?? '/canvas',
    }
);
