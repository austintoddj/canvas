import { SparklesIcon } from '@heroicons/react/20/solid';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, Fieldset, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import SeoPreview from '@/components/posts/SeoPreview';
import { useCanvas } from '@/hooks/useCanvas';
import { aiApi } from '@/lib/api/ai';
import {
    AI_FIELD_PENDING_CLASS,
    AI_FIELD_SETTLED_CLASS,
    AI_REWRITE_SETTLE_MS,
} from '@/lib/posts/ai-rewrite-decoration';
import { rewriteErrorMessage } from '@/lib/posts/ai-writing';
import type { PostFormState } from '@/lib/posts/form';
import { hasMetaOverrides, isValidUrl, seoSourceText, updatePostMeta, type PostSeoInput } from '@/lib/seo';
import { toast } from '@/lib/toast';
import type { LaravelValidationErrors } from '@/lib/api';

type PostSeoPanelProps = {
    form: PostFormState;
    onChange: (form: PostFormState) => void;
    fieldErrors: LaravelValidationErrors;
    disabled?: boolean;
};

type SeoAiField = 'title' | 'description';

function fieldError(errors: LaravelValidationErrors, key: string): string | undefined {
    return errors[key]?.[0];
}

function seoInputFromForm(form: PostFormState): PostSeoInput {
    return {
        title: form.title,
        slug: form.slug,
        summary: form.summary,
        body: form.body,
        featuredImage: form.featuredImage,
        featuredImageCaption: form.featuredImageCaption,
        meta: form.meta,
    };
}

export default function PostSeoPanel({ form, onChange, fieldErrors, disabled = false }: PostSeoPanelProps) {
    const { boot, t } = useCanvas();
    const seoTitle = form.meta?.title ?? '';
    const metaDescription = form.meta?.description ?? '';
    const canonicalLink = form.meta?.canonical_link ?? '';
    const canonicalInvalid = canonicalLink.trim() !== '' && !isValidUrl(canonicalLink);
    const hasOverrides = hasMetaOverrides(form.meta);
    const aiEnabled = boot.ai === true;
    const [aiBusy, setAiBusy] = useState(false);
    const [settledFields, setSettledFields] = useState<Set<SeoAiField>>(new Set());
    const abortRef = useRef<AbortController | null>(null);
    const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            abortRef.current?.abort();
            if (settleTimerRef.current !== null) {
                clearTimeout(settleTimerRef.current);
            }
        };
    }, []);

    function updateMetaField(field: 'title' | 'description' | 'canonical_link', value: string) {
        onChange({
            ...form,
            meta: updatePostMeta(form.meta, { [field]: value }),
        });
    }

    function resetOverrides() {
        onChange({ ...form, meta: null });
    }

    function markSettled(fields: SeoAiField[]) {
        if (settleTimerRef.current !== null) {
            clearTimeout(settleTimerRef.current);
        }

        setSettledFields(new Set(fields));
        settleTimerRef.current = setTimeout(() => {
            setSettledFields(new Set());
            settleTimerRef.current = null;
        }, AI_REWRITE_SETTLE_MS);
    }

    function fieldClassName(field: SeoAiField): string | undefined {
        if (aiBusy) {
            return AI_FIELD_PENDING_CLASS;
        }

        if (settledFields.has(field)) {
            return AI_FIELD_SETTLED_CLASS;
        }

        return undefined;
    }

    async function suggestSeo() {
        if (disabled || aiBusy) {
            return;
        }

        const source = seoSourceText({
            title: form.title,
            summary: form.summary,
            body: form.body,
        });

        if (source === null) {
            toast.error(t('editor.ai_seo_empty_source'));

            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setAiBusy(true);
        setSettledFields(new Set());

        try {
            const response = await aiApi.suggestSeo(
                {
                    text: source,
                    title: form.title.trim() === '' ? null : form.title.trim(),
                },
                controller.signal
            );

            const nextTitle = response.title.trim();
            const nextDescription = response.description.trim();

            if (nextTitle === '' || nextDescription === '') {
                toast.error(t('editor.ai_empty_result'));

                return;
            }

            onChange({
                ...form,
                meta: updatePostMeta(form.meta, {
                    title: nextTitle,
                    description: nextDescription,
                }),
            });
            markSettled(['title', 'description']);
        } catch (error) {
            if (controller.signal.aborted || abortRef.current !== controller) {
                return;
            }

            toast.error(
                rewriteErrorMessage(error, t('editor.ai_seo_error'), (key, fallback) => t(key, fallback ?? key))
            );
        } finally {
            if (abortRef.current === controller) {
                abortRef.current = null;
                setAiBusy(false);
            }
        }
    }

    return (
        <Fieldset className="space-y-6" data-post-seo-panel="true">
            <SeoPreview post={seoInputFromForm(form)} />

            {aiEnabled ? (
                <div className="space-y-1.5">
                    <button
                        type="button"
                        data-post-seo-ai="true"
                        disabled={disabled || aiBusy}
                        onClick={() => void suggestSeo()}
                        className={clsx(
                            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition',
                            'text-zinc-700 dark:text-zinc-200',
                            'hover:bg-zinc-950/5 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/10',
                            'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                            aiBusy && 'bg-zinc-950/10 dark:bg-white/15'
                        )}
                    >
                        <SparklesIcon className={clsx('size-3.5', aiBusy && 'animate-pulse')} />
                        {aiBusy ? t('editor.ai_generating') : t('editor.ai_suggest_seo')}
                    </button>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('editor.ai_suggest_seo_help')}</p>
                </div>
            ) : null}

            <Field>
                <Label>{t('editor.seo_title')}</Label>
                <Description>{t('editor.seo_title_help')}</Description>
                <Input
                    name="meta.title"
                    value={seoTitle}
                    disabled={disabled || aiBusy}
                    placeholder={form.title.trim() === '' ? t('editor.untitled_post') : form.title}
                    invalid={fieldError(fieldErrors, 'meta.title') !== undefined}
                    className={fieldClassName('title')}
                    onChange={(event) => updateMetaField('title', event.target.value)}
                />
                <Description>
                    {seoTitle.length > 60
                        ? t('editor.seo_title_truncated', { count: seoTitle.length })
                        : t('editor.seo_title_count', { count: seoTitle.length })}
                </Description>
                {fieldError(fieldErrors, 'meta.title') ? (
                    <ErrorMessage>{fieldError(fieldErrors, 'meta.title')}</ErrorMessage>
                ) : null}
            </Field>

            <Field>
                <Label>{t('editor.meta_description')}</Label>
                <Description>{t('editor.meta_description_help')}</Description>
                <Textarea
                    name="meta.description"
                    rows={3}
                    resizable={false}
                    value={metaDescription}
                    disabled={disabled || aiBusy}
                    placeholder={form.summary.trim() === '' ? t('editor.seo_desc_placeholder') : form.summary}
                    invalid={fieldError(fieldErrors, 'meta.description') !== undefined}
                    className={fieldClassName('description')}
                    onChange={(event) => updateMetaField('description', event.target.value)}
                />
                <Description>
                    {metaDescription.length > 160
                        ? t('editor.meta_desc_truncated', { count: metaDescription.length })
                        : t('editor.meta_desc_count', { count: metaDescription.length })}
                </Description>
                {fieldError(fieldErrors, 'meta.description') ? (
                    <ErrorMessage>{fieldError(fieldErrors, 'meta.description')}</ErrorMessage>
                ) : null}
            </Field>

            <Field>
                <Label>{t('editor.canonical_url')}</Label>
                <Description>{t('editor.canonical_help')}</Description>
                <Input
                    name="meta.canonical_link"
                    value={canonicalLink}
                    disabled={disabled}
                    placeholder="https://example.com/posts/your-slug"
                    invalid={canonicalInvalid || fieldError(fieldErrors, 'meta.canonical_link') !== undefined}
                    onChange={(event) => updateMetaField('canonical_link', event.target.value)}
                />
                {canonicalInvalid ? <ErrorMessage>{t('editor.link_invalid')}</ErrorMessage> : null}
                {fieldError(fieldErrors, 'meta.canonical_link') ? (
                    <ErrorMessage>{fieldError(fieldErrors, 'meta.canonical_link')}</ErrorMessage>
                ) : null}
            </Field>

            {hasOverrides ? (
                <Button type="button" plain disabled={disabled} onClick={resetOverrides}>
                    {t('editor.reset_seo')}
                </Button>
            ) : null}
        </Fieldset>
    );
}
