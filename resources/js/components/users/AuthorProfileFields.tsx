import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import { useMemo, useState } from 'react';

import {
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownTrailingIcon,
    dropdownInsetItemClass,
    selectDropdownMenuClass,
    selectDropdownTriggerClass,
} from '@/components/dropdown';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Switch, SwitchField } from '@/components/switch';
import { Text } from '@/components/text';
import { Textarea } from '@/components/textarea';
import { AvatarImagePicker } from '@/components/users/AvatarImagePicker';
import { SocialLinksEditor } from '@/components/users/SocialLinksEditor';
import { useCanvas } from '@/hooks/useCanvas';
import type { LaravelValidationErrors } from '@/lib/api';
import type { ProfileFormState, SocialFieldKey } from '@/lib/settings/profile';
import { listTimezones } from '@/lib/timezones';
import type { LanguageOption } from '@/types/boot';

type AuthorProfileFieldsProps = {
    form: ProfileFormState;
    fieldErrors: LaravelValidationErrors;
    languages: LanguageOption[];
    socialEditorKey?: string;
    localeSwitching?: boolean;
    avatarInitials?: string;
    onPatch: (patch: Partial<ProfileFormState>) => void;
    onLocaleChange: (locale: string) => void;
    onClearFieldError: (key: string) => void;
};

function LanguageSelectDropdown({
    value,
    options,
    onChange,
    invalid,
    disabled,
}: {
    value: string;
    options: LanguageOption[];
    onChange: (locale: string) => void;
    invalid?: boolean;
    disabled?: boolean;
}) {
    const { t } = useCanvas();
    const selectedLabel = options.find((option) => option.code === value)?.label ?? value;

    return (
        <Dropdown>
            <DropdownButton
                outline
                disabled={disabled}
                data-invalid={invalid ? true : undefined}
                aria-invalid={invalid || undefined}
                aria-busy={disabled || undefined}
                className={clsx(
                    selectDropdownTriggerClass,
                    invalid && 'border-red-500 dark:border-red-600'
                )}
            >
                <span className="min-w-0 truncate text-left">{selectedLabel || t('profile.select_language')}</span>
                <ChevronDownIcon data-slot="icon" className="shrink-0" />
            </DropdownButton>
            <DropdownMenu anchor="bottom start" className={selectDropdownMenuClass}>
                {options.map((option) => {
                    const selected = value === option.code;

                    return (
                        <DropdownItem
                            key={option.code}
                            onClick={() => onChange(option.code)}
                            className={dropdownInsetItemClass}
                            disabled={disabled}
                        >
                            <DropdownLabel inset>{option.label}</DropdownLabel>
                            {selected ? (
                                <DropdownTrailingIcon inset>
                                    <CheckIcon className="size-4 text-zinc-950 dark:text-white" />
                                </DropdownTrailingIcon>
                            ) : null}
                        </DropdownItem>
                    );
                })}
            </DropdownMenu>
        </Dropdown>
    );
}

function TimezoneSelectDropdown({
    value,
    onChange,
    invalid,
}: {
    value: string;
    onChange: (timezone: string) => void;
    invalid?: boolean;
}) {
    const { t } = useCanvas();
    const timezones = useMemo(() => listTimezones(), []);
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();

        if (needle === '') {
            return timezones;
        }

        return timezones.filter((zone) => zone.toLowerCase().includes(needle));
    }, [query, timezones]);

    const options = useMemo(() => {
        if (value !== '' && !filtered.includes(value) && !timezones.includes(value)) {
            return [value, ...filtered];
        }

        if (value !== '' && !filtered.includes(value) && timezones.includes(value)) {
            return [value, ...filtered.filter((zone) => zone !== value)];
        }

        return filtered;
    }, [filtered, timezones, value]);

    return (
        <Dropdown>
            <DropdownButton
                outline
                data-invalid={invalid ? true : undefined}
                aria-invalid={invalid || undefined}
                className={clsx(
                    selectDropdownTriggerClass,
                    invalid && 'border-red-500 dark:border-red-600'
                )}
            >
                <span className="min-w-0 truncate text-left">{value || t('profile.select_timezone')}</span>
                <ChevronDownIcon data-slot="icon" className="shrink-0" />
            </DropdownButton>
            <DropdownMenu anchor="bottom start" className={selectDropdownMenuClass}>
                <div className="sticky top-0 z-10 border-b border-zinc-950/5 bg-white p-2 dark:border-white/10 dark:bg-zinc-900">
                    <Input
                        name="timezone-filter"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('profile.search_timezones')}
                        autoComplete="off"
                    />
                </div>
                {options.length === 0 ? (
                    <div className="px-3.5 py-2.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {t('common.no_matches')}
                    </div>
                ) : (
                    options.slice(0, 100).map((zone) => {
                        const selected = value === zone;

                        return (
                            <DropdownItem
                                key={zone}
                                onClick={() => {
                                    onChange(zone);
                                    setQuery('');
                                }}
                                className={dropdownInsetItemClass}
                            >
                                <DropdownLabel inset>{zone}</DropdownLabel>
                                {selected ? (
                                    <DropdownTrailingIcon inset>
                                        <CheckIcon className="size-4 text-zinc-950 dark:text-white" />
                                    </DropdownTrailingIcon>
                                ) : null}
                            </DropdownItem>
                        );
                    })
                )}
            </DropdownMenu>
        </Dropdown>
    );
}

export function AuthorProfileFields({
    form,
    fieldErrors,
    languages,
    socialEditorKey,
    localeSwitching = false,
    avatarInitials,
    onPatch,
    onLocaleChange,
    onClearFieldError,
}: AuthorProfileFieldsProps) {
    const { t } = useCanvas();

    function handleSocialChange(social: Record<SocialFieldKey, string>) {
        onPatch({ social });
        onClearFieldError('social');

        for (const key of Object.keys(social) as SocialFieldKey[]) {
            onClearFieldError(`social.${key}`);
        }
    }

    return (
        <div className="space-y-8">
            <Fieldset>
                <Legend>{t('profile.legend')}</Legend>
                <Text className="mt-1">{t('profile.public_help')}</Text>
                <FieldGroup>
                    <Field>
                        <Label>{t('profile.username')}</Label>
                        <Description>{t('profile.username_help')}</Description>
                        <Input
                            name="username"
                            value={form.username}
                            onChange={(event) => {
                                onPatch({ username: event.target.value });
                                onClearFieldError('username');
                            }}
                            invalid={Boolean(fieldErrors.username)}
                        />
                        {fieldErrors.username?.[0] ? <ErrorMessage>{fieldErrors.username[0]}</ErrorMessage> : null}
                    </Field>

                    <Field>
                        <Label>{t('profile.bio')}</Label>
                        <Description>{t('profile.bio_help')}</Description>
                        <Textarea
                            name="summary"
                            rows={3}
                            value={form.summary}
                            onChange={(event) => {
                                onPatch({ summary: event.target.value });
                                onClearFieldError('summary');
                            }}
                            invalid={Boolean(fieldErrors.summary)}
                        />
                        {fieldErrors.summary?.[0] ? <ErrorMessage>{fieldErrors.summary[0]}</ErrorMessage> : null}
                    </Field>

                    <AvatarImagePicker
                        value={form.avatar}
                        initials={avatarInitials}
                        invalid={Boolean(fieldErrors.avatar)}
                        error={fieldErrors.avatar?.[0]}
                        onChange={(avatar) => {
                            onPatch({ avatar });
                            onClearFieldError('avatar');
                        }}
                    />

                    <Field>
                        <Label>{t('profile.website')}</Label>
                        <Input
                            name="website"
                            type="url"
                            value={form.website}
                            onChange={(event) => {
                                onPatch({ website: event.target.value });
                                onClearFieldError('website');
                            }}
                            invalid={Boolean(fieldErrors.website)}
                            placeholder="https://"
                        />
                        {fieldErrors.website?.[0] ? <ErrorMessage>{fieldErrors.website[0]}</ErrorMessage> : null}
                    </Field>
                </FieldGroup>
            </Fieldset>

            <Fieldset>
                <Legend>{t('profile.social_legend')}</Legend>
                <Text className="mt-1">{t('profile.social_help')}</Text>
                <SocialLinksEditor
                    key={socialEditorKey}
                    social={form.social}
                    fieldErrors={fieldErrors}
                    onChange={handleSocialChange}
                />
            </Fieldset>

            <Fieldset>
                <Legend>{t('profile.preferences')}</Legend>
                <FieldGroup>
                    <Field>
                        <Label>{t('profile.language')}</Label>
                        <Description>{t('profile.language_help')}</Description>
                        <div className="mt-3">
                            <LanguageSelectDropdown
                                value={form.locale}
                                options={languages}
                                onChange={onLocaleChange}
                                invalid={Boolean(fieldErrors.locale)}
                                disabled={localeSwitching}
                            />
                        </div>
                        {fieldErrors.locale?.[0] ? <ErrorMessage>{fieldErrors.locale[0]}</ErrorMessage> : null}
                    </Field>

                    <Field>
                        <Label>{t('profile.timezone')}</Label>
                        <Description>{t('profile.timezone_help')}</Description>
                        <div className="mt-3">
                            <TimezoneSelectDropdown
                                value={form.timezone}
                                onChange={(timezone) => {
                                    onPatch({ timezone });
                                    onClearFieldError('timezone');
                                }}
                                invalid={Boolean(fieldErrors.timezone)}
                            />
                        </div>
                        {fieldErrors.timezone?.[0] ? <ErrorMessage>{fieldErrors.timezone[0]}</ErrorMessage> : null}
                    </Field>

                    <SwitchField>
                        <Label>{t('profile.digest')}</Label>
                        <Description>{t('profile.digest_help')}</Description>
                        <Switch
                            name="digest"
                            checked={form.digest}
                            onChange={(checked) => onPatch({ digest: checked })}
                            color="dark/zinc"
                        />
                    </SwitchField>
                </FieldGroup>
            </Fieldset>
        </div>
    );
}
