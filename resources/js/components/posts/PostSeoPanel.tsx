import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, Fieldset, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import SeoPreview from '@/components/posts/SeoPreview';
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
    const seoTitle = form.meta?.title ?? '';
    const metaDescription = form.meta?.description ?? '';
    const canonicalLink = form.meta?.canonical_link ?? '';
    const canonicalInvalid = canonicalLink.trim() !== '' && !isValidUrl(canonicalLink);

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
        <Fieldset className="space-y-6">
            <Field>
                <Label>SEO title</Label>
                <Description>Overrides the post title in search results. Aim for ~60 characters.</Description>
                <Input
                    name="meta.title"
                    value={seoTitle}
                    disabled={disabled}
                    placeholder={form.title.trim() === '' ? 'Untitled post' : form.title}
                    invalid={fieldError(fieldErrors, 'meta.title') !== undefined}
                    onChange={(event) => updateMetaField('title', event.target.value)}
                />
                <Description>
                    {seoTitle.length} / 60{seoTitle.length > 60 ? ' — may be truncated in search results' : ''}
                </Description>
                {fieldError(fieldErrors, 'meta.title') ? (
                    <ErrorMessage>{fieldError(fieldErrors, 'meta.title')}</ErrorMessage>
                ) : null}
            </Field>

            <Field>
                <Label>Meta description</Label>
                <Description>Overrides the summary in search and social previews. Aim for ~160 characters.</Description>
                <Textarea
                    name="meta.description"
                    rows={3}
                    resizable={false}
                    value={metaDescription}
                    disabled={disabled}
                    placeholder={form.summary.trim() === '' ? 'Uses summary or body excerpt when empty' : form.summary}
                    invalid={fieldError(fieldErrors, 'meta.description') !== undefined}
                    onChange={(event) => updateMetaField('description', event.target.value)}
                />
                <Description>
                    {metaDescription.length} / 160
                    {metaDescription.length > 160 ? ' — may be truncated in search results' : ''}
                </Description>
                {fieldError(fieldErrors, 'meta.description') ? (
                    <ErrorMessage>{fieldError(fieldErrors, 'meta.description')}</ErrorMessage>
                ) : null}
            </Field>

            <Field>
                <Label>Canonical URL</Label>
                <Description>Leave empty to use the default public post URL.</Description>
                <Input
                    name="meta.canonical_link"
                    value={canonicalLink}
                    disabled={disabled}
                    placeholder="https://example.com/posts/your-slug"
                    invalid={
                        canonicalInvalid || fieldError(fieldErrors, 'meta.canonical_link') !== undefined
                    }
                    onChange={(event) => updateMetaField('canonical_link', event.target.value)}
                />
                {canonicalInvalid ? <ErrorMessage>Enter a valid http or https URL.</ErrorMessage> : null}
                {fieldError(fieldErrors, 'meta.canonical_link') ? (
                    <ErrorMessage>{fieldError(fieldErrors, 'meta.canonical_link')}</ErrorMessage>
                ) : null}
            </Field>

            {hasMetaOverrides(form.meta) ? (
                <Button type="button" plain disabled={disabled} onClick={resetOverrides}>
                    Reset SEO overrides
                </Button>
            ) : null}

            <SeoPreview post={seoInputFromForm(form)} />
        </Fieldset>
    );
}