import { useLayoutEffect, useRef } from 'react';

import { Avatar } from '@/components/avatar';
import { Dialog, DialogBody, DialogCloseButton, DialogTitle } from '@/components/dialog';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { bodyHtmlForEditor, parsePublishedAt, type PostFormState } from '@/lib/posts/form';
import { installCardIframeResize } from '@/lib/posts/iframe-resize';
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

    // useLayoutEffect so the resize listener (and iframe force-reload nudge) run
    // before paint. useEffect was too late: Twitter often posts height before the
    // listener attaches, leaving cards stuck at the 12rem placeholder.
    // Canvas UI avoids this race with a document-level listener on first paint;
    // the SPA preview injects HTML when the dialog opens, so it must nudge-reload
    // cards after the listener is attached (see nudgeCardIframeResize).
    useLayoutEffect(() => {
        if (!open || !hasBody) {
            return;
        }

        const el = bodyRef.current;

        if (el === null) {
            return;
        }

        return installCardIframeResize(el, { nudge: true });
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
