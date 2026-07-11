import { ArrowLeftIcon, NoSymbolIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
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
    adminUserFromResource,
    serializeAdminUserForm,
    SOCIAL_FIELD_KEYS,
    toAdminUserStorePayload,
    type AdminUserFormState,
    type SocialFieldKey,
} from '@/lib/settings/profile';
import { toast } from '@/lib/toast';
import { ROLE_OPTIONS, userInitials } from '@/lib/users/roles';
import type { UserResource } from '@/types/boot';

const SOCIAL_LABELS: Record<SocialFieldKey, string> = {
    twitter: 'Twitter / X',
    github: 'GitHub',
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
};

export default function SettingsUsersShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { boot, user: currentUser } = useCanvas();

    const [user, setUser] = useState<UserResource | null>(null);
    const [form, setForm] = useState<AdminUserFormState | null>(null);
    const [baseline, setBaseline] = useState('');
    const [loading, setLoading] = useState(() => Boolean(id));
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [revoking, setRevoking] = useState(false);
    const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<LaravelValidationErrors>({});

    useEffect(() => {
        if (!id) {
            return;
        }

        const controller = new AbortController();

        async function load() {
            setLoading(true);
            setLoadError(null);

            try {
                const fresh = await usersApi.show(id!, controller.signal);
                const nextForm = adminUserFromResource(fresh, {
                    locale: boot.languageCodes[0] ?? 'en',
                    timezone: boot.timezone,
                });
                setUser(fresh);
                setForm(nextForm);
                setBaseline(serializeAdminUserForm(nextForm));
                setLoading(false);
            } catch {
                if (!controller.signal.aborted) {
                    setLoadError('Unable to load this user.');
                    setLoading(false);
                }
            }
        }

        void load();

        return () => controller.abort();
    }, [boot.languageCodes, boot.timezone, id]);

    const isDirty = form !== null && serializeAdminUserForm(form) !== baseline;
    const isSelf = user !== null && user.id === currentUser.id;

    function patchForm(patch: Partial<AdminUserFormState>) {
        setForm((current) => (current === null ? current : { ...current, ...patch }));
    }

    function patchSocial(key: SocialFieldKey, value: string) {
        setForm((current) => {
            if (current === null) {
                return current;
            }

            return {
                ...current,
                social: { ...current.social, [key]: value },
            };
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
        if (!id || !form || saving) {
            return;
        }

        setSaving(true);
        setFieldErrors({});

        try {
            const response = await usersApi.store(id, toAdminUserStorePayload(form));
            const nextForm = adminUserFromResource(response.user, {
                locale: boot.languageCodes[0] ?? 'en',
                timezone: boot.timezone,
            });
            setUser(response.user);
            setForm(nextForm);
            setBaseline(serializeAdminUserForm(nextForm));
            toast.success('User updated.');
        } catch (error) {
            if (error instanceof ValidationError) {
                setFieldErrors(error.errors);
                toast.error('Please fix the highlighted fields.');
            } else {
                toast.error('Unable to save this user.');
            }
        } finally {
            setSaving(false);
        }
    }

    function openRevokeConfirm() {
        if (!id || !user || isSelf || revoking) {
            return;
        }

        setConfirmRevokeOpen(true);
    }

    function closeRevokeConfirm() {
        if (revoking) {
            return;
        }

        setConfirmRevokeOpen(false);
    }

    async function confirmRevoke() {
        if (!id || !user || isSelf || revoking) {
            return;
        }

        setRevoking(true);

        try {
            await usersApi.destroy(id);
            setConfirmRevokeOpen(false);
            toast.success(`Access revoked for ${user.name}.`);
            navigate('/settings/users');
        } catch {
            toast.error('Unable to revoke access.');
            setRevoking(false);
            setConfirmRevokeOpen(false);
        }
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-2xl space-y-8" aria-busy="true">
                <PageHeader title="User">
                    <PageDescription>Loading…</PageDescription>
                </PageHeader>
                <FormPanelSkeleton fields={6} />
            </div>
        );
    }

    if (!id || loadError || !user || !form) {
        return (
            <div className="mx-auto max-w-2xl space-y-8">
                <PageHeader title="User" />
                <ErrorText>{!id ? 'User not found.' : (loadError ?? 'User not found.')}</ErrorText>
                <div>
                    <Button href="/settings/users" outline>
                        <ArrowLeftIcon data-slot="icon" />
                        Back to users
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mx-auto max-w-2xl space-y-8">
                <PageHeader
                    title={user.name}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {!isSelf ? (
                                <Button
                                    type="button"
                                    outline
                                    color="red"
                                    disabled={revoking || saving}
                                    onClick={openRevokeConfirm}
                                >
                                    <NoSymbolIcon data-slot="icon" />
                                    {revoking ? 'Revoking…' : 'Revoke access'}
                                </Button>
                            ) : null}
                            <Button
                                type="button"
                                color="dark/zinc"
                                disabled={saving || !isDirty}
                                onClick={() => void handleSave()}
                            >
                                {saving ? 'Saving…' : 'Save'}
                            </Button>
                        </div>
                    }
                >
                    <PageDescription>Manage role and Canvas profile for this teammate</PageDescription>
                </PageHeader>

                <div className="mt-4">
                    <Button href="/settings/users" plain>
                        <ArrowLeftIcon data-slot="icon" />
                        Users
                    </Button>
                </div>

                <div className="mt-8 flex items-center gap-4 rounded-2xl border border-zinc-950/10 bg-zinc-950/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <Avatar src={user.avatar_url} initials={userInitials(user.name)} className="size-14" alt="" />
                    <div className="min-w-0">
                        <Text className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                            {user.name}
                        </Text>
                        <Text className="mt-0.5 truncate text-sm text-canvas-muted dark:text-canvas-muted-dark">
                            {user.email}
                        </Text>
                        <Text className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                            Host identity is read-only · {(user.posts_count ?? 0).toLocaleString()} posts
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
                        <Legend>Access</Legend>
                        <FieldGroup>
                            <Field>
                                <Label>Role</Label>
                                <Description>Controls what this person can manage in Canvas.</Description>
                                <Select
                                    name="role"
                                    value={form.role === null ? '' : String(form.role)}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        patchForm({ role: value === '' ? null : Number.parseInt(value, 10) });
                                        clearFieldError('role');
                                    }}
                                    invalid={Boolean(fieldErrors.role)}
                                    disabled={isSelf}
                                >
                                    {ROLE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {boot.roles[option.value] ?? option.label}
                                        </option>
                                    ))}
                                </Select>
                                {isSelf ? <Description>You cannot change your own role here.</Description> : null}
                                {fieldErrors.role?.[0] ? <ErrorMessage>{fieldErrors.role[0]}</ErrorMessage> : null}
                            </Field>
                        </FieldGroup>
                    </Fieldset>

                    <Fieldset className="mt-12">
                        <Legend>Profile</Legend>
                        <FieldGroup>
                            <Field>
                                <Label>Username</Label>
                                <Input
                                    name="username"
                                    value={form.username}
                                    onChange={(event) => {
                                        patchForm({ username: event.target.value });
                                        clearFieldError('username');
                                    }}
                                    invalid={Boolean(fieldErrors.username)}
                                />
                                {fieldErrors.username?.[0] ? (
                                    <ErrorMessage>{fieldErrors.username[0]}</ErrorMessage>
                                ) : null}
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
                                {fieldErrors.summary?.[0] ? (
                                    <ErrorMessage>{fieldErrors.summary[0]}</ErrorMessage>
                                ) : null}
                            </Field>

                            <Field>
                                <Label>Avatar URL</Label>
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
                                {fieldErrors.website?.[0] ? (
                                    <ErrorMessage>{fieldErrors.website[0]}</ErrorMessage>
                                ) : null}
                            </Field>
                        </FieldGroup>
                    </Fieldset>

                    <Fieldset className="mt-12">
                        <Legend>Social links</Legend>
                        <FieldGroup>
                            {SOCIAL_FIELD_KEYS.map((key) => (
                                <Field key={key}>
                                    <Label>{SOCIAL_LABELS[key]}</Label>
                                    <Input
                                        name={`social.${key}`}
                                        type="url"
                                        value={form.social[key]}
                                        onChange={(event) => patchSocial(key, event.target.value)}
                                        placeholder="https://"
                                    />
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
                                {fieldErrors.timezone?.[0] ? (
                                    <ErrorMessage>{fieldErrors.timezone[0]}</ErrorMessage>
                                ) : null}
                            </Field>

                            <SwitchField>
                                <Label>Weekly digest</Label>
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
                        <Button type="button" outline href="/settings/users">
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>

            <Alert open={confirmRevokeOpen} onClose={closeRevokeConfirm} size="sm">
                <AlertTitle>Revoke access?</AlertTitle>
                <AlertDescription>
                    Revoke Canvas access for {user.name}? They will lose the admin dashboard until access is granted
                    again.
                </AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={revoking} onClick={closeRevokeConfirm}>
                        Cancel
                    </Button>
                    <Button type="button" color="red" disabled={revoking} onClick={() => void confirmRevoke()}>
                        {revoking ? 'Revoking…' : 'Revoke access'}
                    </Button>
                </AlertActions>
            </Alert>
        </>
    );
}
