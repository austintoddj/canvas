import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, Fieldset, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import SeoPreview from '@/components/posts/SeoPreview';
import { useCanvas } from '@/hooks/useCanvas';
import { hasMetaOverrides, isValidUrl, updatePostMeta, type PostSeoInput } from '@/lib/seo';
import type { PostFormState } from '@/lib/posts/form';
import type { LaravelValidationErrors } from '@/lib/api';

type PostSeoPanelProps = {
    form: PostFormState;
    onChange: (form: PostFormState) => void;
    fieldErrors: LaravelValidationErrors;
    disabled?: boolean;
};

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
    const { t } = useCanvas();
    const seoTitle = form.meta?.title ?? '';
    const metaDescription = form.meta?.description ?? '';
    const canonicalLink = form.meta?.canonical_link ?? '';
    const canonicalInvalid = canonicalLink.trim() !== '' && !isValidUrl(canonicalLink);
    const hasOverrides = hasMetaOverrides(form.meta);

    function updateMetaField(field: 'title' | 'description' | 'canonical_link', value: string) {
        onChange({
            ...form,
            meta: updatePostMeta(form.meta, { [field]: value }),
        });
    }

    function resetOverrides() {
        onChange({ ...form, meta: null });
    }

    return (
        <Fieldset className="space-y-6" data-post-seo-panel="true">
            <SeoPreview post={seoInputFromForm(form)} />

            <Field>
                <Label>{t('editor.seo_title')}</Label>
                <Description>{t('editor.seo_title_help')}</Description>
                <Input
                    name="meta.title"
                    value={seoTitle}
                    disabled={disabled}
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
                <Label>{t('editor.meta_description')}</Label>
                <Description>{t('editor.meta_description_help')}</Description>
                <Textarea
                    name="meta.description"
                    rows={3}
                    resizable={false}
                    value={metaDescription}
                    disabled={disabled}
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
