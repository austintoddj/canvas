import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

import {
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownTrailingIcon,
    dropdownInsetItemClass,
} from '@/components/dropdown';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Switch, SwitchField } from '@/components/switch';
import { Text } from '@/components/text';
import { Textarea } from '@/components/textarea';
import type { LaravelValidationErrors } from '@/lib/api';
import {
    SOCIAL_FIELD_KEYS,
    type ProfileFormState,
    type SocialFieldKey,
} from '@/lib/settings/profile';

const SOCIAL_LABELS: Record<SocialFieldKey, string> = {
    twitter: 'Twitter / X',
    github: 'GitHub',
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
};

type AuthorProfileFieldsProps = {
    form: ProfileFormState;
    fieldErrors: LaravelValidationErrors;
    languageCodes: string[];
    onPatch: (patch: Partial<ProfileFormState>) => void;
    onPatchSocial: (key: SocialFieldKey, value: string) => void;
    onClearFieldError: (key: string) => void;
};

function LocaleSelectDropdown({
    value,
    options,
    onChange,
    invalid,
}: {
    value: string;
    options: string[];
    onChange: (locale: string) => void;
    invalid?: boolean;
}) {
    return (
        <Dropdown>
            <DropdownButton
                outline
                data-invalid={invalid ? true : undefined}
                aria-invalid={invalid || undefined}
                className={clsx(
                    'w-full cursor-pointer justify-between font-normal',
                    invalid && 'border-red-500 dark:border-red-600'
                )}
            >
                <span className="min-w-0 truncate text-left">{value || 'Select locale'}</span>
                <ChevronDownIcon data-slot="icon" className="shrink-0" />
            </DropdownButton>
            <DropdownMenu anchor="bottom start" className="z-50 min-w-40 max-w-sm">
                {options.map((code) => {
                    const selected = value === code;

                    return (
                        <DropdownItem
                            key={code}
                            onClick={() => onChange(code)}
                            className={dropdownInsetItemClass}
                        >
                            <DropdownLabel inset>{code}</DropdownLabel>
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

export function AuthorProfileFields({
    form,
    fieldErrors,
    languageCodes,
    onPatch,
    onPatchSocial,
    onClearFieldError,
}: AuthorProfileFieldsProps) {
    return (
        <div className="space-y-8">
            <Fieldset>
                <Legend>Profile</Legend>
                <Text className="mt-1">Shown on your public author page.</Text>
                <FieldGroup>
                    <Field>
                        <Label>Username</Label>
                        <Description>Your public handle. Letters, numbers, and dashes work best.</Description>
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
                        <Label>Bio</Label>
                        <Description>A short intro shown with your posts.</Description>
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

                    <Field>
                        <Label>Avatar URL</Label>
                        <Description>Leave blank to use your host avatar.</Description>
                        <Input
                            name="avatar"
                            type="url"
                            value={form.avatar}
                            onChange={(event) => {
                                onPatch({ avatar: event.target.value });
                                onClearFieldError('avatar');
                            }}
                            invalid={Boolean(fieldErrors.avatar)}
                            placeholder="https://"
                        />
                        {fieldErrors.avatar?.[0] ? <ErrorMessage>{fieldErrors.avatar[0]}</ErrorMessage> : null}
                    </Field>

                    <Field>
                        <Label>Website</Label>
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
                <Legend>Social links</Legend>
                <Text className="mt-1">Optional. Shown on your author page when set.</Text>
                <FieldGroup>
                    {SOCIAL_FIELD_KEYS.map((key) => (
                        <Field key={key}>
                            <Label>{SOCIAL_LABELS[key]}</Label>
                            <Input
                                name={`social.${key}`}
                                type="url"
                                value={form.social[key]}
                                onChange={(event) => onPatchSocial(key, event.target.value)}
                                invalid={Boolean(fieldErrors[`social.${key}`] || fieldErrors.social)}
                                placeholder="https://"
                            />
                            {fieldErrors[`social.${key}`]?.[0] ? (
                                <ErrorMessage>{fieldErrors[`social.${key}`][0]}</ErrorMessage>
                            ) : null}
                        </Field>
                    ))}
                </FieldGroup>
            </Fieldset>

            <Fieldset>
                <Legend>Preferences</Legend>
                <FieldGroup>
                    <Field>
                        <Label>Locale</Label>
                        <div className="mt-3">
                            <LocaleSelectDropdown
                                value={form.locale}
                                options={languageCodes}
                                onChange={(locale) => {
                                    onPatch({ locale });
                                    onClearFieldError('locale');
                                }}
                                invalid={Boolean(fieldErrors.locale)}
                            />
                        </div>
                        {fieldErrors.locale?.[0] ? <ErrorMessage>{fieldErrors.locale[0]}</ErrorMessage> : null}
                    </Field>

                    <Field>
                        <Label>Timezone</Label>
                        <Input
                            name="timezone"
                            value={form.timezone}
                            onChange={(event) => {
                                onPatch({ timezone: event.target.value });
                                onClearFieldError('timezone');
                            }}
                            invalid={Boolean(fieldErrors.timezone)}
                            placeholder="UTC"
                        />
                        {fieldErrors.timezone?.[0] ? <ErrorMessage>{fieldErrors.timezone[0]}</ErrorMessage> : null}
                    </Field>

                    <SwitchField>
                        <Label>Weekly digest</Label>
                        <Description>Get a weekly email of views and new posts.</Description>
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
