import { ArrowLeftIcon, ChartBarIcon, Cog6ToothIcon, GlobeAltIcon } from '@heroicons/react/20/solid';
import { useEffect, useState, type ReactNode } from 'react';
import clsx from 'clsx';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Heading } from '@/components/heading';
import { Text, ErrorText } from '@/components/text';
import { isPublished, navSaveStatusLabel, type PostFormState, type PostSaveStatus } from '@/lib/posts/form';

export type PostEditorFocusControls = {
    focusMode: boolean;
    onToggleFocusMode: () => void;
};

type PostEditorLayoutProps = {
    form: PostFormState;
    postId: string | null;
    titleError?: string;
    saveStatus: PostSaveStatus;
    onTitleChange: (title: string) => void;
    onOpenSettings: () => void;
    onOpenSeo: () => void;
    body: ReactNode | ((focus: PostEditorFocusControls) => ReactNode);
    disabled?: boolean;
};

export default function PostEditorLayout({
    form,
    postId,
    titleError,
    saveStatus,
    onTitleChange,
    onOpenSettings,
    onOpenSeo,
    body,
    disabled = false,
}: PostEditorLayoutProps) {
    const published = isPublished(form);
    const statusLabel = navSaveStatusLabel(saveStatus);
    const [focusMode, setFocusMode] = useState(false);

    useEffect(() => {
        if (!focusMode) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [focusMode]);

    useEffect(() => {
        if (!focusMode) {
            return;
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape' || event.defaultPrevented) {
                return;
            }

            setFocusMode(false);
        }

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [focusMode]);

    const focusControls: PostEditorFocusControls = {
        focusMode,
        onToggleFocusMode: () => setFocusMode((current) => !current),
    };

    const bodyNode = typeof body === 'function' ? body(focusControls) : body;

    const chrome = (
        <div
            className={clsx(
                'flex flex-wrap items-center justify-between gap-4 border-b border-zinc-950/10 dark:border-white/10',
                focusMode ? 'shrink-0 bg-white px-4 py-4 sm:px-6 lg:px-10 dark:bg-zinc-900' : 'pb-4'
            )}
        >
            <div className="flex min-w-0 items-center gap-3">
                {!focusMode ? (
                    <Button href="/posts" plain aria-label="Back to posts">
                        <ArrowLeftIcon data-slot="icon" />
                    </Button>
                ) : null}
                <div className="flex min-w-0 items-center gap-2">
                    <Heading level={2} className="truncate text-lg/7">
                        {form.title.trim() === '' ? 'Untitled post' : form.title}
                    </Heading>
                    <Badge color={published ? 'green' : 'amber'}>{published ? 'Published' : 'Draft'}</Badge>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {statusLabel ? (
                    <Text
                        className={
                            saveStatus === 'error'
                                ? 'text-sm text-canvas-danger dark:text-canvas-danger-dark'
                                : 'text-sm text-canvas-muted dark:text-canvas-muted-dark'
                        }
                        data-post-save-status="true"
                        aria-live="polite"
                    >
                        {statusLabel}
                    </Text>
                ) : null}
                {published && postId !== null && !focusMode ? (
                    <Button href={`/posts/${postId}/stats`} plain aria-label="View post stats" title="Stats">
                        <ChartBarIcon data-slot="icon" />
                        Stats
                    </Button>
                ) : null}
                <Button
                    type="button"
                    outline
                    disabled={disabled}
                    onClick={onOpenSeo}
                    aria-label="SEO"
                    title="SEO"
                    data-post-seo-trigger
                >
                    <GlobeAltIcon data-slot="icon" />
                </Button>
                <Button
                    type="button"
                    outline
                    disabled={disabled}
                    onClick={onOpenSettings}
                    aria-label="Settings"
                    title="Settings"
                    data-post-settings-trigger
                >
                    <Cog6ToothIcon data-slot="icon" />
                </Button>
            </div>
        </div>
    );

    const writing = (
        <div className={clsx('mx-auto min-w-0 max-w-3xl space-y-6', focusMode && 'pt-2')}>
            <div>
                <label htmlFor="post-title" className="sr-only">
                    Title
                </label>
                <input
                    id="post-title"
                    name="title"
                    value={form.title}
                    disabled={disabled}
                    placeholder="Post title"
                    aria-invalid={titleError !== undefined}
                    className="block w-full border-0 bg-transparent px-0 py-3 text-3xl font-semibold leading-snug text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-4xl sm:leading-snug dark:text-white dark:placeholder:text-zinc-500"
                    onChange={(event) => onTitleChange(event.target.value)}
                />
                {titleError ? <ErrorText className="mt-2">{titleError}</ErrorText> : null}
            </div>

            {bodyNode}
        </div>
    );

    if (focusMode) {
        return (
            <div className="fixed inset-0 z-40 flex flex-col bg-white dark:bg-zinc-900" data-post-editor-focus="true">
                {chrome}
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">{writing}</div>
            </div>
        );
    }

    return (
        <div className="space-y-8" data-post-editor-focus="false">
            {chrome}
            {writing}
        </div>
    );
}
