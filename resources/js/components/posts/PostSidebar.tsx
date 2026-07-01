import { BadgeButton } from '@/components/badge';
import { Description, ErrorMessage, Field, Fieldset, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { slugify, taxonomyFromName, type PostFormState } from '@/lib/posts/form';
import type { LaravelValidationErrors } from '@/lib/api';
import type { TaxonomyOption } from '@/types/api';
import { useState } from 'react';

type PostSidebarProps = {
    form: PostFormState;
    onChange: (form: PostFormState) => void;
    onSlugManualEdit?: () => void;
    availableTags: TaxonomyOption[];
    availableTopics: TaxonomyOption[];
    fieldErrors: LaravelValidationErrors;
    disabled?: boolean;
};

function fieldError(errors: LaravelValidationErrors, key: string): string | undefined {
    return errors[key]?.[0];
}

export default function PostSidebar({
    form,
    onChange,
    onSlugManualEdit,
    availableTags,
    availableTopics,
    fieldErrors,
    disabled = false,
}: PostSidebarProps) {
    const [tagQuery, setTagQuery] = useState('');

    const canvasPath = (window.Canvas?.path ?? '/canvas').replace(/\/$/, '');
    const slugPreview = form.slug === '' ? '…' : form.slug;

    function updateTopicFromQuery(value: string) {
        const trimmed = value.trim();

        if (trimmed === '') {
            onChange({ ...form, topic: null });
            return;
        }

        const existing =
            availableTopics.find((topic) => topic.name.toLowerCase() === trimmed.toLowerCase()) ??
            availableTopics.find((topic) => topic.slug === slugify(trimmed));

        onChange({ ...form, topic: existing ?? taxonomyFromName(trimmed) });
    }

    function addTag(tag: TaxonomyOption) {
        if (form.tags.some((existing) => existing.slug === tag.slug)) {
            return;
        }

        onChange({ ...form, tags: [...form.tags, tag] });
        setTagQuery('');
    }

    function removeTag(slug: string) {
        onChange({ ...form, tags: form.tags.filter((tag) => tag.slug !== slug) });
    }

    function commitTagQuery() {
        const trimmed = tagQuery.trim();

        if (trimmed === '') {
            return;
        }

        addTag(taxonomyFromName(trimmed));
    }

    const tagSuggestions = availableTags.filter((tag) => !form.tags.some((selected) => selected.slug === tag.slug));

    return (
        <Fieldset className="space-y-6">
            <Field>
                <Label>Slug</Label>
                <Description>{`${canvasPath}/posts/${slugPreview}`}</Description>
                <Input
                    name="slug"
                    value={form.slug}
                    disabled={disabled}
                    invalid={fieldError(fieldErrors, 'slug') !== undefined}
                    onChange={(event) => {
                        onSlugManualEdit?.();
                        onChange({ ...form, slug: event.target.value });
                    }}
                />
                {fieldError(fieldErrors, 'slug') ? (
                    <ErrorMessage>{fieldError(fieldErrors, 'slug')}</ErrorMessage>
                ) : null}
            </Field>

            <Field>
                <Label>Summary</Label>
                <Description>A short deck shown below the title on the reader.</Description>
                <Textarea
                    name="summary"
                    rows={3}
                    resizable={false}
                    value={form.summary}
                    disabled={disabled}
                    invalid={fieldError(fieldErrors, 'summary') !== undefined}
                    onChange={(event) => onChange({ ...form, summary: event.target.value })}
                />
                {fieldError(fieldErrors, 'summary') ? (
                    <ErrorMessage>{fieldError(fieldErrors, 'summary')}</ErrorMessage>
                ) : null}
            </Field>

            <Field>
                <Label>Topic</Label>
                <Description>Select an existing topic or type a new one.</Description>
                <Input
                    name="topic"
                    value={form.topic?.name ?? ''}
                    disabled={disabled}
                    placeholder="Topic"
                    list="post-topic-suggestions"
                    onChange={(event) => updateTopicFromQuery(event.target.value)}
                    onBlur={(event) => updateTopicFromQuery(event.target.value)}
                />
                <datalist id="post-topic-suggestions">
                    {availableTopics.map((topic) => (
                        <option key={topic.slug} value={topic.name} />
                    ))}
                </datalist>
            </Field>

            <Field>
                <Label>Tags</Label>
                <Description>Press Enter to add a tag. Unknown tags are created on save.</Description>
                {form.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {form.tags.map((tag) => (
                            <BadgeButton
                                key={tag.slug}
                                color="zinc"
                                disabled={disabled}
                                onClick={() => removeTag(tag.slug)}
                            >
                                {tag.name}
                                <span aria-hidden="true" className="ml-1 text-zinc-400">
                                    ×
                                </span>
                            </BadgeButton>
                        ))}
                    </div>
                ) : null}
                <div className="mt-3">
                    <Input
                        name="tags"
                        value={tagQuery}
                        disabled={disabled}
                        placeholder="Add a tag"
                        list="post-tag-suggestions"
                        onChange={(event) => setTagQuery(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                commitTagQuery();
                            }
                        }}
                        onBlur={commitTagQuery}
                    />
                    <datalist id="post-tag-suggestions">
                        {tagSuggestions.map((tag) => (
                            <option key={tag.slug} value={tag.name} />
                        ))}
                    </datalist>
                </div>
            </Field>
        </Fieldset>
    );
}
