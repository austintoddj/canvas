import { useEffect, useState } from 'react';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { FormPanelSkeleton } from '@/components/FormPanelSkeleton';
import { Input } from '@/components/input';
import { PageHeader } from '@/components/PageHeader';
import { Select } from '@/components/select';
import { Switch, SwitchField } from '@/components/switch';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { Textarea } from '@/components/textarea';
import { useCanvas } from '@/hooks/useCanvas';
import { ValidationError, type LaravelValidationErrors } from '@/lib/api';
import { usersApi } from '@/lib/api/users';
import {
    profileFromUser,
    serializeProfileForm,
    SOCIAL_FIELD_KEYS,
    toProfileStorePayload,
    type ProfileFormState,
    type SocialFieldKey,
} from '@/lib/settings/profile';
import { toast } from '@/lib/toast';
import type { UserResource } from '@/types/boot';

const SOCIAL_LABELS: Record<SocialFieldKey, string> = {
    twitter: 'Twitter / X',
    github: 'GitHub',
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
};

export default function SettingsProfile() {
    const { user: bootUser, boot } = useCanvas();
    const [user, setUser] = useState<UserResource>(bootUser);
    const [form, setForm] = useState<ProfileFormState>(() =>
        profileFromUser(bootUser, { locale: boot.languageCodes[0] ?? 'en', timezone: boot.timezone })
    );
    const [baseline, setBaseline] = useState(() =>
        serializeProfileForm(
            profileFromUser(bootUser, { locale: boot.languageCodes[0] ?? 'en', timezone: boot.timezone })
        )
    );
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<LaravelValidationErrors>({});

    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            setLoading(true);
            setLoadError(null);

            try {
                const fresh = await usersApi.show(String(bootUser.id), controller.signal);
                const nextForm = profileFromUser(fresh, {
                    locale: boot.languageCodes[0] ?? 'en',
                    timezone: boot.timezone,
                });
                setUser(fresh);
                setForm(nextForm);
                setBaseline(serializeProfileForm(nextForm));
                setLoading(false);
            } catch {
                if (!controller.signal.aborted) {
                    // Boot user is enough to edit if show fails for non-admin self-view edge cases
                    const fallback = profileFromUser(bootUser, {
                        locale: boot.languageCodes[0] ?? 'en',
                        timezone: boot.timezone,
                    });
                    setForm(fallback);
                    setBaseline(serializeProfileForm(fallback));
                    setLoadError(null);
                    setLoading(false);
                }
            }
        }

        void load();

        return () => controller.abort();
    }, [boot.languageCodes, boot.timezone, bootUser]);

    const isDirty = serializeProfileForm(form) !== baseline;

    function patchForm(patch: Partial<ProfileFormState>) {
        setForm((current) => ({ ...current, ...patch }));
    }

    function patchSocial(key: SocialFieldKey, value: string) {
        setForm((current) => ({
            ...current,
            social: { ...current.social, [key]: value },
        }));
        setFieldErrors((current) => {
            const next = { ...current };
            delete next[`social.${key}`];
            delete next.social;
            return next;
        });
    }

    function clearFieldError(key: string) {
        setFieldErrors((current) => {
            if (current[key] === undefined) {
                return current;
            }

            const next = { ...current };
            delete next[key];
            return next;
        });
    }

    async function handleSave() {
        if (saving) {
            return;
        }

        setSaving(true);
        setFieldErrors({});

        try {
            const response = await usersApi.store(String(user.id), toProfileStorePayload(form));
            const nextForm = profileFromUser(response.user, {
                locale: boot.languageCodes[0] ?? 'en',
                timezone: boot.timezone,
            });
            setUser(response.user);
            setForm(nextForm);
            setBaseline(serializeProfileForm(nextForm));
            toast.success('Profile saved.');
        } catch (error) {
            if (error instanceof ValidationError) {
                setFieldErrors(error.errors);
                toast.error('Please fix the highlighted fields.');
            } else {
                toast.error('Unable to save your profile.');
            }
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-2xl space-y-8" aria-busy="true">
                <PageHeader title="Settings">
                    <PageDescription>Your Canvas profile</PageDescription>
                </PageHeader>
                <FormPanelSkeleton fields={6} />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            <PageHeader
                title="Settings"
                actions={
                    <Button
                        type="button"
                        color="dark/zinc"
                        disabled={saving || !isDirty}
                        onClick={() => void handleSave()}
                    >
                        {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                }
            >
                <PageDescription>Your author profile and notification preferences</PageDescription>
            </PageHeader>

            {loadError ? <ErrorText>{loadError}</ErrorText> : null}

            <div className="flex items-center gap-4 rounded-2xl border border-zinc-950/10 bg-zinc-950/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <Avatar src={user.avatar_url || form.avatar || null} className="size-14" alt="" />
                <div className="min-w-0">
                    <Text className="truncate text-sm font-semibold text-zinc-950 dark:text-white">{user.name}</Text>
                    <Text className="mt-0.5 truncate text-sm text-canvas-muted dark:text-canvas-muted-dark">
                        {user.email}
                    </Text>
                    <Text className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                        Name and email come from your host account
                    </Text>
                </div>
            </div>

            <form
                className="mt-10"
                onSubmit={(event) => {
                    event.preventDefault();
                    void handleSave();
                }}
            >
                <Fieldset>
                    <Legend>Profile</Legend>
                    <Text className="mt-1">Public author details used across Canvas.</Text>
                    <FieldGroup>
                        <Field>
                            <Label>Username</Label>
                            <Description>Unique handle for your author profile.</Description>
                            <Input
                                name="username"
                                value={form.username}
                                onChange={(event) => {
                                    patchForm({ username: event.target.value });
                                    clearFieldError('username');
                                }}
                                invalid={Boolean(fieldErrors.username)}
                            />
                            {fieldErrors.username?.[0] ? <ErrorMessage>{fieldErrors.username[0]}</ErrorMessage> : null}
                        </Field>

                        <Field>
                            <Label>Bio</Label>
                            <Textarea
                                name="summary"
                                rows={4}
                                value={form.summary}
                                onChange={(event) => {
                                    patchForm({ summary: event.target.value });
                                    clearFieldError('summary');
                                }}
                                invalid={Boolean(fieldErrors.summary)}
                            />
                            {fieldErrors.summary?.[0] ? <ErrorMessage>{fieldErrors.summary[0]}</ErrorMessage> : null}
                        </Field>

                        <Field>
                            <Label>Avatar URL</Label>
                            <Description>Full URL to an image. Leave blank to use your host avatar.</Description>
                            <Input
                                name="avatar"
                                type="url"
                                value={form.avatar}
                                onChange={(event) => {
                                    patchForm({ avatar: event.target.value });
                                    clearFieldError('avatar');
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
                                    patchForm({ website: event.target.value });
                                    clearFieldError('website');
                                }}
                                invalid={Boolean(fieldErrors.website)}
                                placeholder="https://"
                            />
                            {fieldErrors.website?.[0] ? <ErrorMessage>{fieldErrors.website[0]}</ErrorMessage> : null}
                        </Field>
                    </FieldGroup>
                </Fieldset>

                <Fieldset className="mt-12">
                    <Legend>Social links</Legend>
                    <Text className="mt-1">Optional profile URLs shown on your author page.</Text>
                    <FieldGroup>
                        {SOCIAL_FIELD_KEYS.map((key) => (
                            <Field key={key}>
                                <Label>{SOCIAL_LABELS[key]}</Label>
                                <Input
                                    name={`social.${key}`}
                                    type="url"
                                    value={form.social[key]}
                                    onChange={(event) => patchSocial(key, event.target.value)}
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

                <Fieldset className="mt-12">
                    <Legend>Preferences</Legend>
                    <FieldGroup>
                        <Field>
                            <Label>Locale</Label>
                            <Select
                                name="locale"
                                value={form.locale}
                                onChange={(event) => {
                                    patchForm({ locale: event.target.value });
                                    clearFieldError('locale');
                                }}
                                invalid={Boolean(fieldErrors.locale)}
                            >
                                {boot.languageCodes.map((code) => (
                                    <option key={code} value={code}>
                                        {code}
                                    </option>
                                ))}
                            </Select>
                            {fieldErrors.locale?.[0] ? <ErrorMessage>{fieldErrors.locale[0]}</ErrorMessage> : null}
                        </Field>

                        <Field>
                            <Label>Timezone</Label>
                            <Input
                                name="timezone"
                                value={form.timezone}
                                onChange={(event) => {
                                    patchForm({ timezone: event.target.value });
                                    clearFieldError('timezone');
                                }}
                                invalid={Boolean(fieldErrors.timezone)}
                                placeholder="UTC"
                            />
                            {fieldErrors.timezone?.[0] ? <ErrorMessage>{fieldErrors.timezone[0]}</ErrorMessage> : null}
                        </Field>

                        <SwitchField>
                            <Label>Weekly digest</Label>
                            <Description>Email a summary of activity when digests are enabled.</Description>
                            <Switch
                                name="digest"
                                checked={form.digest}
                                onChange={(checked) => patchForm({ digest: checked })}
                                color="dark/zinc"
                            />
                        </SwitchField>
                    </FieldGroup>
                </Fieldset>

                <div className="mt-10 flex flex-wrap items-center gap-3">
                    <Button type="submit" color="dark/zinc" disabled={saving || !isDirty}>
                        {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
