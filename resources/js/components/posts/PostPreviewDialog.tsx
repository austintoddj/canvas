import { useLayoutEffect, useRef } from 'react';

import { Avatar } from '@/components/avatar';
import { Dialog, DialogBody, DialogCloseButton, DialogTitle } from '@/components/dialog';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { bodyHtmlForEditor, parsePublishedAt, type PostFormState } from '@/lib/posts/form';
import {
    ensureDocumentCardIframeResize,
    isCardIframeAtPlaceholderHeight,
    nudgeCardIframeResize,
} from '@/lib/posts/iframe-resize';
import { userInitials } from '@/lib/users/roles';

type PostPreviewDialogProps = {
    open: boolean;
    form: PostFormState;
    onClose: () => void;
};

function formatPreviewDate(value: string | null, locale: string): string {
    const date = value !== null && value.trim() !== '' ? parsePublishedAt(value) : new Date();

    if (date === null || Number.isNaN(date.getTime())) {
        return new Date().toLocaleDateString(locale, { dateStyle: 'medium' });
    }

    return date.toLocaleDateString(locale, { dateStyle: 'medium' });
}

export default function PostPreviewDialog({ open, form, onClose }: PostPreviewDialogProps) {
    const { boot, user, t } = useCanvas();
    const locale = user.canvas?.locale ?? boot.defaultLocale;
    const title = (form.title ?? '').trim() === '' ? t('editor.untitled_post') : form.title;
    const summary = (form.summary ?? '').trim();
    const bodyHtml = bodyHtmlForEditor(form.body);
    const hasBody = bodyHtml !== '';
    const featuredSrc =
        form.featuredImage !== null && form.featuredImage.trim() !== '' ? form.featuredImage.trim() : null;
    const author = form.author;
    const authorName = (author?.name ?? '').trim();
    const displayName = authorName !== '' ? authorName : author !== null ? t('users.unknown', 'Unknown') : user.name;
    const avatarSrc =
        author?.avatar_url ?? (author === null ? (user.avatar_url ?? user.canvas?.avatar_url ?? null) : null);
    const dateLabel = formatPreviewDate(form.publishedAt, locale);
    const bodyRef = useRef<HTMLDivElement>(null);

    // Document-level listener (Canvas UI parity) is installed at app boot and
    // re-asserted here. Fresh preview iframes load once; Twitter posts heights
    // to the already-attached listener. We only re-nudge cards still stuck at
    // the 12rem placeholder after a delay — never thrash loads on an interval.
    useLayoutEffect(() => {
        ensureDocumentCardIframeResize();

        if (!open || !hasBody) {
            return;
        }

        let cancelled = false;
        let raf = 0;
        let recoveryTimer = 0;

        const scheduleRecovery = (el: HTMLElement) => {
            // One delayed recovery only: if a card never received a height
            // (missed early postMessage / nested-frame match failure), force a
            // single reload of still-placeholder cards so Twitter re-sends.
            recoveryTimer = window.setTimeout(() => {
                if (cancelled || bodyRef.current !== el) {
                    return;
                }

                const cards = el.querySelectorAll<HTMLIFrameElement>(
                    'iframe[src*="platform.twitter.com/embed"], iframe[src*="Tweet.html"]'
                );
                let stuck = false;

                cards.forEach((iframe) => {
                    if (isCardIframeAtPlaceholderHeight(iframe)) {
                        stuck = true;
                    }
                });

                if (stuck) {
                    nudgeCardIframeResize(el, { onlyPlaceholder: true });
                }
            }, 600);
        };

        const attach = () => {
            if (cancelled) {
                return;
            }

            const el = bodyRef.current;

            if (el === null) {
                // Dialog Transition may mount panel content one frame later.
                raf = window.requestAnimationFrame(attach);

                return;
            }

            scheduleRecovery(el);
        };

        attach();

        return () => {
            cancelled = true;

            if (raf !== 0) {
                window.cancelAnimationFrame(raf);
            }

            if (recoveryTimer !== 0) {
                window.clearTimeout(recoveryTimer);
            }
        };
    }, [open, hasBody, bodyHtml]);

    return (
        <Dialog open={open} onClose={onClose} size="5xl" align="top" data-post-preview-dialog="true">
            <div className="relative flex items-start justify-between gap-3">
                <DialogTitle className="min-w-0 pe-2">{t('editor.preview')}</DialogTitle>
                <DialogCloseButton label={t('common.close')} className="-me-1 -mt-1" />
            </div>
            <DialogBody className="min-w-0 overflow-visible">
                <article className="mx-auto max-w-3xl overflow-visible">
                    <header className="mb-8">
                        {form.topic !== null ? (
                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                {form.topic.name}
                            </p>
                        ) : null}

                        <h1 className="mt-2 text-3xl font-bold leading-tight text-zinc-950 sm:text-4xl dark:text-white">
                            {title}
                        </h1>

                        {summary !== '' ? (
                            <p className="mt-4 text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">{summary}</p>
                        ) : null}

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                            <div className="flex items-center gap-2" data-post-preview-author="true">
                                <Avatar
                                    src={avatarSrc}
                                    initials={userInitials(displayName)}
                                    className="size-8"
                                    alt=""
                                />
                                <span className="font-medium text-zinc-700 dark:text-zinc-200">{displayName}</span>
                            </div>
                            <span aria-hidden="true">&middot;</span>
                            <time>{dateLabel}</time>
                        </div>
                    </header>

                    {featuredSrc !== null ? (
                        <figure className="mb-8">
                            <img
                                src={featuredSrc}
                                alt={form.featuredImageCaption ?? title}
                                className="w-full rounded-lg object-cover"
                            />
                            {form.featuredImageCaption !== null && form.featuredImageCaption.trim() !== '' ? (
                                <figcaption className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
                                    {form.featuredImageCaption}
                                </figcaption>
                            ) : null}
                        </figure>
                    ) : null}

                    {hasBody ? (
                        <div
                            ref={bodyRef}
                            className="canvas-post-body"
                            data-post-preview-body="true"
                            dangerouslySetInnerHTML={{ __html: bodyHtml }}
                        />
                    ) : (
                        <Text data-post-preview-empty="true">
                            {t('editor.preview_empty_body', 'Nothing written yet.')}
                        </Text>
                    )}
                </article>
            </DialogBody>
        </Dialog>
    );
}
