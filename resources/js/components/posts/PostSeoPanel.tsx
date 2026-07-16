import { SparklesIcon } from '@heroicons/react/20/solid';
import { useRef, useState } from 'react';
import clsx from 'clsx';

import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, Fieldset, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import SeoPreview from '@/components/posts/SeoPreview';
import { useCanvas } from '@/hooks/useCanvas';
import { aiApi } from '@/lib/api/ai';
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

function AiGenerateButton({
    label,
    busy,
    disabled,
    onClick,
}: {
    label: string;
    busy: boolean;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled || busy}
            onClick={onClick}
            data-post-seo-ai="true"
            className={clsx(
                'inline-flex size-6 shrink-0 items-center justify-center rounded-md text-zinc-500 transition dark:text-zinc-400',
                'hover:bg-zinc-950/5 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-white',
                'focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
                busy && 'bg-zinc-950/10 text-zinc-950 dark:bg-white/15 dark:text-white'
            )}
        >
            <SparklesIcon className={clsx('size-3.5', busy && 'animate-pulse')} />
        </button>
    );
}

export default function PostSeoPanel({ form, onChange, fieldErrors, disabled = false }: PostSeoPanelProps) {
    const { boot, t } = useCanvas();
    const seoTitle = form.meta?.title ?? '';
    const metaDescription = form.meta?.description ?? '';
    const canonicalLink = form.meta?.canonical_link ?? '';
    const canonicalInvalid = canonicalLink.trim() !== '' && !isValidUrl(canonicalLink);
    const hasOverrides = hasMetaOverrides(form.meta);
    const aiEnabled = boot.ai === true;
    const [aiField, setAiField] = useState<SeoAiField | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    function updateMetaField(field: 'title' | 'description' | 'canonical_link', value: string) {
        onChange({
            ...form,
            meta: updatePostMeta(form.meta, { [field]: value }),
        });
    }

    function resetOverrides() {
        onChange({ ...form, meta: null });
    }

    async function generateSeoField(field: SeoAiField) {
        if (disabled || aiField !== null) {
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
        setAiField(field);

        try {
            const response = await aiApi.rewrite(
                {
                    action: field === 'title' ? 'seo_title' : 'seo_description',
                    text: source,
                    title: form.title.trim() === '' ? null : form.title.trim(),
                },
                controller.signal
            );

            const next = response.text.trim();

            if (next === '') {
                toast.error(t('editor.ai_empty_result'));

                return;
            }

            updateMetaField(field, next);
        } catch (error) {
            if (controller.signal.aborted || abortRef.current !== controller) {
                return;
            }

            toast.error(rewriteErrorMessage(error, t('editor.ai_seo_error')));
        } finally {
            if (abortRef.current === controller) {
                abortRef.current = null;
                setAiField(null);
            }
        }
    }

    return (
        <Fieldset className="space-y-6" data-post-seo-panel="true">
            <SeoPreview post={seoInputFromForm(form)} />

            <Field>
                <div className="flex items-center gap-1.5">
                    <Label>{t('editor.seo_title')}</Label>
                    {aiEnabled ? (
                        <AiGenerateButton
                            label={aiField === 'title' ? t('editor.ai_generating') : t('editor.ai_generate_seo_title')}
                            busy={aiField === 'title'}
                            disabled={disabled || aiField === 'description'}
                            onClick={() => void generateSeoField('title')}
                        />
                    ) : null}
                </div>
                <Description>{t('editor.seo_title_help')}</Description>
                <Input
                    name="meta.title"
                    value={seoTitle}
                    disabled={disabled || aiField === 'title'}
                    placeholder={form.title.trim() === '' ? t('editor.untitled_post') : form.title}
                    invalid={fieldError(fieldErrors, 'meta.title') !== undefined}
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
                <div className="flex items-center gap-1.5">
                    <Label>{t('editor.meta_description')}</Label>
                    {aiEnabled ? (
                        <AiGenerateButton
                            label={
                                aiField === 'description'
                                    ? t('editor.ai_generating')
                                    : t('editor.ai_generate_meta_description')
                            }
                            busy={aiField === 'description'}
                            disabled={disabled || aiField === 'title'}
                            onClick={() => void generateSeoField('description')}
                        />
                    ) : null}
                </div>
                <Description>{t('editor.meta_description_help')}</Description>
                <Textarea
                    name="meta.description"
                    rows={3}
                    resizable={false}
                    value={metaDescription}
                    disabled={disabled || aiField === 'description'}
                    placeholder={form.summary.trim() === '' ? t('editor.seo_desc_placeholder') : form.summary}
                    invalid={fieldError(fieldErrors, 'meta.description') !== undefined}
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
