import { ArrowLeftIcon, ChartBarIcon, Cog6ToothIcon, GlobeAltIcon } from '@heroicons/react/20/solid';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import clsx from 'clsx';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Heading } from '@/components/heading';
import { ErrorText } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { CONTENT_REVEAL_MS, shouldAnimateReveal } from '@/lib/async-ui';
import {
    isPublished,
    navSaveStatusLabel,
    publishStatus,
    type PostFormState,
    type PostSaveStatus,
} from '@/lib/posts/form';

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
    const { t } = useCanvas();
    const reducedMotion = useReducedMotion();
    const animateStatus = shouldAnimateReveal({ reducedMotion: reducedMotion === true, animate: true });
    const published = isPublished(form);
    const status = publishStatus(form);
    const badgeColor = status === 'published' ? 'green' : status === 'scheduled' ? 'blue' : 'amber';
    const badgeLabel =
        status === 'published'
            ? t('editor.published_badge')
            : status === 'scheduled'
              ? t('editor.scheduled_badge')
              : t('editor.draft_badge');
    const statusLabel = navSaveStatusLabel(saveStatus, {
        saving: t('common.saving'),
        saved: t('common.saved'),
        error: t('editor.save_failed'),
    });
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
                'flex items-center justify-between gap-2 border-b border-zinc-950/10 sm:gap-4 dark:border-white/10',
                focusMode ? 'shrink-0 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:px-10 dark:bg-zinc-900' : 'pb-3 sm:pb-4'
            )}
        >
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
                {!focusMode ? (
                    <Button href="/posts" plain aria-label={t('editor.back_to_posts')}>
                        <ArrowLeftIcon data-slot="icon" />
                    </Button>
                ) : null}
                <div className="flex min-w-0 items-center gap-2">
                    <Heading level={2} className={clsx('truncate text-lg/7', focusMode ? 'block' : 'hidden sm:block')}>
                        {(form.title ?? '').trim() === '' ? t('editor.untitled_post') : form.title}
                    </Heading>
                    <Badge color={badgeColor} data-publish-status={status}>
                        {badgeLabel}
                    </Badge>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <div className="relative flex min-h-5 items-center justify-end" aria-live="polite">
                    <AnimatePresence mode="wait" initial={false}>
                        {statusLabel ? (
                            <motion.p
                                key={`${saveStatus}-${statusLabel}`}
                                data-slot="text"
                                data-post-save-status="true"
                                className={
                                    saveStatus === 'error'
                                        ? 'me-1 whitespace-nowrap text-xs text-canvas-danger sm:me-0 sm:text-sm dark:text-canvas-danger-dark'
                                        : 'me-1 whitespace-nowrap text-xs text-canvas-muted sm:me-0 sm:text-sm dark:text-canvas-muted-dark'
                                }
                                initial={animateStatus ? { opacity: 0 } : false}
                                animate={{ opacity: 1 }}
                                exit={animateStatus ? { opacity: 0 } : undefined}
                                transition={{
                                    duration: animateStatus ? CONTENT_REVEAL_MS / 1000 : 0,
                                    ease: 'easeOut',
                                }}
                            >
                                {statusLabel}
                            </motion.p>
                        ) : null}
                    </AnimatePresence>
                </div>
                {published && postId !== null && !focusMode ? (
                    <Button
                        href={`/posts/${postId}/stats`}
                        plain
                        aria-label={t('editor.view_stats')}
                        title={t('editor.stats')}
                    >
                        <ChartBarIcon data-slot="icon" />
                        <span className="hidden sm:inline">{t('editor.stats')}</span>
                    </Button>
                ) : null}
                <Button
                    type="button"
                    outline
                    disabled={disabled}
                    onClick={onOpenSeo}
                    aria-label={t('editor.seo')}
                    title={t('editor.seo')}
                    data-post-seo-trigger
                >
                    <GlobeAltIcon data-slot="icon" />
                </Button>
                <Button
                    type="button"
                    outline
                    disabled={disabled}
                    onClick={onOpenSettings}
                    aria-label={t('editor.settings')}
                    title={t('editor.settings')}
                    data-post-settings-trigger
                >
                    <Cog6ToothIcon data-slot="icon" />
                </Button>
            </div>
        </div>
    );

    const writing = (
        <div className={clsx('mx-auto min-w-0 max-w-3xl space-y-4 sm:space-y-6', focusMode && 'pt-2')}>
            <div>
                <label htmlFor="post-title" className="sr-only">
                    {t('editor.title_label')}
                </label>
                <input
                    id="post-title"
                    name="title"
                    value={form.title}
                    disabled={disabled}
                    placeholder={t('editor.title_placeholder')}
                    aria-invalid={titleError !== undefined}
                    className="block w-full border-0 bg-transparent px-0 py-2 text-3xl font-semibold leading-snug text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-4xl sm:leading-snug dark:text-white dark:placeholder:text-zinc-500"
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
        <div className="space-y-4 sm:space-y-8" data-post-editor-focus="false">
            {chrome}
            {writing}
        </div>
    );
}
