import { createBrowserRouter } from 'react-router-dom';
import Page, { Dashboard, PostsIndex } from './components/Page';
import Layout from './layouts/Layout';

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
        basename: window.Canvas?.path ?? '/canvas',
    }
);
