import { lazy, Suspense } from 'react';

export const Dashboard = lazy(() => import('../pages/Dashboard'));
export const PostsIndex = lazy(() => import('../pages/Posts/Index'));

export default function Page({ component: Component }: { component: React.ComponentType }) {
    return (
        <Suspense fallback={null}>
            <Component />
        </Suspense>
    );
}
