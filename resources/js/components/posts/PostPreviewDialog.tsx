import { Dialog, DialogBody, DialogCloseButton, DialogTitle } from '@/components/dialog';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { resolveMediaUrl } from '@/lib/media/list';
import { bodyHtmlForEditor, parsePublishedAt, type PostFormState } from '@/lib/posts/form';

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
        form.featuredImage !== null && form.featuredImage.trim() !== '' ? resolveMediaUrl(form.featuredImage) : null;
    const avatarSrc = user.avatar_url ?? user.canvas?.avatar_url ?? null;
    const dateLabel = formatPreviewDate(form.publishedAt, locale);

    return (
        <Dialog open={open} onClose={onClose} size="5xl" data-post-preview-dialog="true">
            <div className="relative flex items-start justify-between gap-3">
                <DialogTitle className="min-w-0 pe-2">{t('editor.preview')}</DialogTitle>
                <DialogCloseButton label={t('common.close')} className="-me-1 -mt-1" />
            </div>
            <DialogBody>
                <article className="mx-auto max-w-3xl">
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
                            <div className="flex items-center gap-2">
                                {avatarSrc !== null ? (
                                    <img src={avatarSrc} alt="" className="size-8 rounded-full object-cover" />
                                ) : (
                                    <span className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                                        {user.name.trim().charAt(0).toUpperCase() || '?'}
                                    </span>
                                )}
                                <span className="font-medium text-zinc-700 dark:text-zinc-200">{user.name}</span>
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
