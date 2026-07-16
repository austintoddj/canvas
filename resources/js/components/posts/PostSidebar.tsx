import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

import { BadgeButton } from '@/components/badge';
import {
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownTrailingIcon,
    dropdownInsetItemClass,
    selectDropdownMenuClass,
    selectDropdownTriggerCompactClass,
} from '@/components/dropdown';
import { Description, ErrorMessage, Field, Fieldset, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { useCanvas } from '@/hooks/useCanvas';
import { isExistingTaxonomy, type PostFormState } from '@/lib/posts/form';
import type { LaravelValidationErrors } from '@/lib/api';
import type { TaxonomyOption } from '@/types/api';

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

function TaxonomySelectButton({
    label,
    emptyLabel,
    disabled,
}: {
    label: string | null;
    emptyLabel: string;
    disabled?: boolean;
}) {
    return (
        <DropdownButton
            outline
            disabled={disabled}
            className={clsx(
                selectDropdownTriggerCompactClass,
                'mt-3',
                label === null && 'text-zinc-500 dark:text-zinc-400'
            )}
        >
            <span className="min-w-0 truncate text-left">{label ?? emptyLabel}</span>
            <ChevronDownIcon data-slot="icon" className="shrink-0" />
        </DropdownButton>
    );
}

function TaxonomyMenuItem({
    label,
    selected,
    disabled,
    onClick,
}: {
    label: string;
    selected?: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <DropdownItem disabled={disabled} onClick={onClick} className={dropdownInsetItemClass}>
            <DropdownLabel inset>{label}</DropdownLabel>
            {selected ? (
                <DropdownTrailingIcon inset>
                    <CheckIcon className="size-4 text-zinc-950 dark:text-white" />
                </DropdownTrailingIcon>
            ) : null}
        </DropdownItem>
    );
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
    const { t } = useCanvas();
    const canvasPath = (window.Canvas?.path ?? '/canvas').replace(/\/$/, '');
    const slugPreview = form.slug === '' ? '…' : form.slug;

    const tagChoices = availableTags.filter((tag) => !form.tags.some((selected) => selected.slug === tag.slug));

    function setTopic(topic: TaxonomyOption | null) {
        onChange({ ...form, topic });
    }

    function addTag(tag: TaxonomyOption) {
        if (form.tags.some((existing) => existing.slug === tag.slug)) {
            return;
        }

        onChange({ ...form, tags: [...form.tags, tag] });
    }

    function removeTag(slug: string) {
        onChange({ ...form, tags: form.tags.filter((tag) => tag.slug !== slug) });
    }

    return (
        <Fieldset className="space-y-6">
            <Field className="min-w-0">
                <Label>{t('editor.slug')}</Label>
                <Description className="break-all">{`${canvasPath}/posts/${slugPreview}`}</Description>
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
                <Label>{t('editor.summary')}</Label>
                <Description>{t('editor.summary_help')}</Description>
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

            <Field className="min-w-0">
                <Label>{t('editor.topic')}</Label>
                <Description>{t('editor.topic_help')}</Description>
                <Dropdown>
                    <TaxonomySelectButton
                        label={form.topic?.name ?? null}
                        emptyLabel={t('editor.select_topic')}
                        disabled={disabled}
                    />
                    <DropdownMenu anchor="bottom start" className={selectDropdownMenuClass}>
                        <TaxonomyMenuItem
                            label={t('editor.no_topic')}
                            selected={form.topic === null}
                            onClick={() => setTopic(null)}
                        />
                        {availableTopics.length === 0 ? (
                            <TaxonomyMenuItem label={t('editor.no_topics_yet')} disabled onClick={() => undefined} />
                        ) : (
                            availableTopics.map((topic) => (
                                <TaxonomyMenuItem
                                    key={topic.slug}
                                    label={topic.name}
                                    selected={form.topic?.slug === topic.slug}
                                    onClick={() => setTopic(topic)}
                                />
                            ))
                        )}
                    </DropdownMenu>
                </Dropdown>
            </Field>

            <Field className="min-w-0">
                <Label>{t('editor.tags')}</Label>
                <Description>{t('editor.tags_help')}</Description>
                {form.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {form.tags.map((tag) => {
                            const isNew = !isExistingTaxonomy(tag, availableTags);

                            return (
                                <BadgeButton
                                    key={tag.slug}
                                    color={isNew ? 'amber' : 'zinc'}
                                    disabled={disabled}
                                    onClick={() => removeTag(tag.slug)}
                                    title={isNew ? t('editor.unknown_tag') : t('editor.remove_tag')}
                                    data-pending-taxonomy={isNew ? 'tag' : undefined}
                                >
                                    {tag.name}
                                    {isNew ? (
                                        <span className="ml-1 text-[0.65rem] font-medium uppercase tracking-wide opacity-80">
                                            {t('editor.new_badge')}
                                        </span>
                                    ) : null}
                                    <span aria-hidden="true" className="ml-1 text-zinc-400">
                                        ×
                                    </span>
                                </BadgeButton>
                            );
                        })}
                    </div>
                ) : null}
                <Dropdown>
                    <TaxonomySelectButton
                        label={null}
                        emptyLabel={t('editor.add_tag')}
                        disabled={disabled || tagChoices.length === 0}
                    />
                    <DropdownMenu anchor="bottom start" className={selectDropdownMenuClass}>
                        {tagChoices.length === 0 ? (
                            <TaxonomyMenuItem
                                label={
                                    availableTags.length === 0 ? t('editor.no_tags_yet') : t('editor.all_tags_attached')
                                }
                                disabled
                                onClick={() => undefined}
                            />
                        ) : (
                            tagChoices.map((tag) => (
                                <TaxonomyMenuItem key={tag.slug} label={tag.name} onClick={() => addTag(tag)} />
                            ))
                        )}
                    </DropdownMenu>
                </Dropdown>
            </Field>
        </Fieldset>
    );
}
