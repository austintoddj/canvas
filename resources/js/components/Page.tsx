import { lazy, Suspense, type ComponentType } from 'react';

import { PageFallback } from '@/components/PageFallback';

export const Dashboard = lazy(() => import('@/pages/Dashboard'));
export const PostsIndex = lazy(() => import('@/pages/Posts/Index'));
export const PostsEditor = lazy(() => import('@/pages/Posts/Editor'));
export const PostsStats = lazy(() => import('@/pages/Posts/Stats'));
export const CalendarIndex = lazy(() => import('@/pages/Calendar/Index'));
export const MediaIndex = lazy(() => import('@/pages/Media/Index'));
export const MediaShow = lazy(() => import('@/pages/Media/Show'));
export const OrganizeIndex = lazy(() => import('@/pages/Organize/Index'));
export const UsersIndex = lazy(() => import('@/pages/Users/Index'));
export const IntegrationsIndex = lazy(() => import('@/pages/Integrations/Index'));
export const IntegrationsUnsplash = lazy(() => import('@/pages/Integrations/Unsplash'));
export const IntegrationsAi = lazy(() => import('@/pages/Integrations/Ai'));
export const IntegrationsWebhooks = lazy(() => import('@/pages/Integrations/Webhooks'));
export const NotFound = lazy(() => import('@/pages/NotFound'));

export default function Page({ component: Component }: { component: ComponentType }) {
    return (
        <Suspense fallback={<PageFallback />}>
            <Component />
        </Suspense>
    );
}
