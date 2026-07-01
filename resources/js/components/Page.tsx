import { lazy, Suspense, type ComponentType } from 'react';

export const Dashboard = lazy(() => import('@/pages/Dashboard'));
export const PostsIndex = lazy(() => import('@/pages/Posts/Index'));
export const PostsEditor = lazy(() => import('@/pages/Posts/Editor'));
export const PostsStats = lazy(() => import('@/pages/Posts/Stats'));
export const MediaIndex = lazy(() => import('@/pages/Media/Index'));
export const MediaShow = lazy(() => import('@/pages/Media/Show'));
export const TagsIndex = lazy(() => import('@/pages/Tags/Index'));
export const TagsEditor = lazy(() => import('@/pages/Tags/Editor'));
export const TopicsIndex = lazy(() => import('@/pages/Topics/Index'));
export const TopicsEditor = lazy(() => import('@/pages/Topics/Editor'));
export const SettingsProfile = lazy(() => import('@/pages/Settings/Profile'));
export const SettingsUsersIndex = lazy(() => import('@/pages/Settings/Users/Index'));
export const SettingsUsersShow = lazy(() => import('@/pages/Settings/Users/Show'));

export default function Page({ component: Component }: { component: ComponentType }) {
    return (
        <Suspense fallback={null}>
            <Component />
        </Suspense>
    );
}
