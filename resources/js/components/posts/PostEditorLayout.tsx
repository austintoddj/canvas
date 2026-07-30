import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import clsx from 'clsx';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { ErrorText } from '@/components/text';
import { Tooltip } from '@/components/tooltip';
import { useCanvas } from '@/hooks/useCanvas';
import { CONTENT_REVEAL_MS, shouldAnimateReveal } from '@/lib/async-ui';
import {
    editorSaveActivityLabel,
    editorStatusBadge,
    isPublished,
    publishStatus,
    type PostFormState,
    type PostSaveStatus,
} from '@/lib/posts/form';
import { IconArrowLeft, IconChartBar, IconHistory, IconLayoutSidebarRight } from '@tabler/icons-react';

export type PostEditorFocusControls = {
    focusMode: boolean;
    onToggleFocusMode: () => void;
};

/** Icon-only plain controls: match label text weight (no adjacent text to carry contrast). */
const editorChromeIconButtonClassName =
    '![--btn-icon:var(--color-zinc-950)] data-hover:![--btn-icon:var(--color-zinc-950)] data-active:![--btn-icon:var(--color-zinc-950)] dark:![--btn-icon:var(--color-white)] dark:data-hover:![--btn-icon:var(--color-white)] dark:data-active:![--btn-icon:var(--color-white)]';

type PostEditorLayoutProps = {
    form: PostFormState;
    postId: string | null;
    titleError?: string;
    saveStatus: PostSaveStatus;
    hasPendingChanges?: boolean;
    inspectorOpen?: boolean;
    historyOpen?: boolean;
    /** When set, show history control (saved posts only). */
    onOpenHistory?: () => void;
    onTitleChange: (title: string) => void;
    onOpenInspector: () => void;
    onPreview?: () => void;
    onPublishRequest?: () => void;
    onUpdateRequest?: () => void;
    body: ReactNode | ((focus: PostEditorFocusControls) => ReactNode);
    disabled?: boolean;
    publishBusy?: boolean;
};

export default function PostEditorLayout({
    form,
    postId,
    titleError,
    saveStatus,
    hasPendingChanges = false,
    inspectorOpen = false,
    historyOpen = false,
    onOpenHistory,
    onTitleChange,
    onOpenInspector,
    onPreview,
    onPublishRequest,
    onUpdateRequest,
    body,
    disabled = false,
    publishBusy = false,
}: PostEditorLayoutProps) {
    const { t } = useCanvas();
    const reducedMotion = useReducedMotion();
    const animateStatus = shouldAnimateReveal({ reducedMotion: reducedMotion === true, animate: true });
    const published = isPublished(form);
    const status = publishStatus(form);
    const badge = editorStatusBadge(status, hasPendingChanges, {
        draft: t('editor.draft_badge'),
        scheduled: t('editor.scheduled_badge'),
        published: t('editor.published_badge'),
        unpublishedChanges: t('editor.pending_edits_badge', 'Pending edits'),
    });
    const badgeLabelCompact =
        status === 'published' && hasPendingChanges ? t('editor.pending_edits_badge_short', 'Pending') : badge.label;
    const saveActivity = editorSaveActivityLabel(saveStatus, status, {
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
    const showPublish = !published && onPublishRequest !== undefined;
    const showUpdate = published && hasPendingChanges && onUpdateRequest !== undefined;

    const chrome = (
        <div
            className={clsx(
                'flex items-center justify-between gap-2 border-b border-zinc-950/10 sm:gap-4 dark:border-white/10',
                focusMode ? 'shrink-0 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:px-10 dark:bg-zinc-900' : 'pb-3 sm:pb-4'
            )}
        >
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
                {!focusMode ? (
                    <Button href="/posts" plain data-post-back-to-posts>
                        <IconArrowLeft data-slot="icon" />
                        {t('posts.title')}
                    </Button>
                ) : null}
                <div className="flex min-w-0 items-center gap-2">
                    <div className="relative flex min-h-6 items-center">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={`${status}-${hasPendingChanges ? 'pending' : 'clean'}-${badge.label}`}
                                initial={animateStatus ? { opacity: 0 } : false}
                                animate={{ opacity: 1 }}
                                exit={animateStatus ? { opacity: 0 } : undefined}
                                transition={{
                                    duration: animateStatus ? CONTENT_REVEAL_MS / 1000 : 0,
                                    ease: 'easeOut',
                                }}
                                className="inline-flex"
                            >
                                <Badge
                                    color={badge.color}
                                    data-publish-status={status}
                                    data-has-pending-changes={hasPendingChanges ? 'true' : 'false'}
                                    data-editor-status-badge="true"
                                    title={badge.label}
                                >
                                    <span className="sm:hidden">{badgeLabelCompact}</span>
                                    <span className="hidden sm:inline">{badge.label}</span>
                                </Badge>
                            </motion.span>
                        </AnimatePresence>
                    </div>
                    <div className="relative flex min-h-5 min-w-0 items-center" aria-live="polite">
                        <AnimatePresence mode="wait" initial={false}>
                            {saveActivity !== null ? (
                                <motion.p
                                    key={`${saveStatus}-${saveActivity}`}
                                    data-post-save-status={saveStatus}
                                    className={clsx(
                                        'whitespace-nowrap text-xs sm:text-sm',
                                        saveStatus === 'error'
                                            ? 'text-canvas-danger dark:text-canvas-danger-dark'
                                            : 'text-canvas-muted dark:text-canvas-muted-dark'
                                    )}
                                    initial={animateStatus ? { opacity: 0 } : false}
                                    animate={{ opacity: 1 }}
                                    exit={animateStatus ? { opacity: 0 } : undefined}
                                    transition={{
                                        duration: animateStatus ? CONTENT_REVEAL_MS / 1000 : 0,
                                        ease: 'easeOut',
                                    }}
                                >
                                    {saveActivity}
                                </motion.p>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                {!focusMode && onPreview !== undefined ? (
                    <Button type="button" outline disabled={disabled} onClick={onPreview} data-post-preview-trigger>
                        {t('editor.preview')}
                    </Button>
                ) : null}
                {!focusMode && showPublish ? (
                    <Button
                        type="button"
                        color="dark/zinc"
                        disabled={disabled || publishBusy}
                        onClick={onPublishRequest}
                        data-post-publish-trigger
                    >
                        {publishBusy ? t('editor.publishing') : t('editor.publish')}
                    </Button>
                ) : null}
                {!focusMode && showUpdate ? (
                    <Button
                        type="button"
                        color="dark/zinc"
                        disabled={disabled || publishBusy}
                        onClick={onUpdateRequest}
                        data-post-update-trigger
                    >
                        {publishBusy ? t('editor.updating', 'Updating…') : t('editor.update', 'Update')}
                    </Button>
                ) : null}
                {published && postId !== null && !focusMode ? (
                    <Tooltip content={t('editor.stats')} placement="bottom">
                        <Button
                            href={`/posts/${postId}/stats`}
                            plain
                            className={editorChromeIconButtonClassName}
                            aria-label={t('editor.view_stats')}
                        >
                            <IconChartBar data-slot="icon" />
                        </Button>
                    </Tooltip>
                ) : null}
                {!focusMode && onOpenHistory !== undefined ? (
                    <Tooltip content={t('editor.history', 'History')} placement="bottom">
                        <Button
                            type="button"
                            plain
                            className={editorChromeIconButtonClassName}
                            disabled={disabled}
                            onClick={onOpenHistory}
                            aria-label={t('editor.history_title', 'Version history')}
                            aria-expanded={historyOpen}
                            data-post-history-trigger
                        >
                            <IconHistory data-slot="icon" />
                        </Button>
                    </Tooltip>
                ) : null}
                <Tooltip content={t('editor.settings', 'Settings')} placement="bottom">
                    <Button
                        type="button"
                        plain
                        className={editorChromeIconButtonClassName}
                        disabled={disabled}
                        onClick={onOpenInspector}
                        aria-label={t('editor.post_settings')}
                        aria-expanded={inspectorOpen}
                        data-post-inspector-trigger
                    >
                        <IconLayoutSidebarRight data-slot="icon" />
                    </Button>
                </Tooltip>
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
