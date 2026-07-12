import { useEffect, useState } from 'react';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Select } from '@/components/select';
import { SideDrawer } from '@/components/SideDrawer';
import { Switch, SwitchField } from '@/components/switch';
import { Text, ErrorText } from '@/components/text';
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

type UserDetailDrawerProps = {
    open: boolean;
    userId: string | null;
    onClose: () => void;
    onSaved?: (user: UserResource) => void;
    onRevoked?: (userId: number) => void;
};

export function UserDetailDrawer({ open, userId, onClose, onSaved, onRevoked }: UserDetailDrawerProps) {
    const { boot, user: currentUser } = useCanvas();

    const [user, setUser] = useState<UserResource | null>(null);
    const [form, setForm] = useState<AdminUserFormState | null>(null);
    const [baseline, setBaseline] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [revoking, setRevoking] = useState(false);
    const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<LaravelValidationErrors>({});

    useEffect(() => {
        if (!open || userId === null) {
            return;
        }

        let cancelled = false;
        const controller = new AbortController();

        queueMicrotask(() => {
            if (cancelled) {
                return;
            }

            setLoading(true);
            setError(null);
            setFieldErrors({});
            setConfirmRevokeOpen(false);
            setRevoking(false);
            setUser(null);
            setForm(null);
            setBaseline('');
        });

        usersApi
            .show(userId, controller.signal)
            .then((fresh) => {
                if (cancelled) {
                    return;
                }

                const nextForm = adminUserFromResource(fresh, {
                    locale: boot.languageCodes[0] ?? 'en',
                    timezone: boot.timezone,
                });
                setUser(fresh);
                setForm(nextForm);
                setBaseline(serializeAdminUserForm(nextForm));
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Unable to load this user.');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [boot.languageCodes, boot.timezone, open, userId]);

    const isDirty = form !== null && serializeAdminUserForm(form) !== baseline;
    const isSelf = user !== null && user.id === currentUser.id;
    const showForm = !loading && error === null && user !== null && form !== null;
    const title = loading ? 'User' : (user?.name ?? 'User');

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
        if (userId === null || form === null || saving || loading) {
            return;
        }

        setSaving(true);
        setFieldErrors({});
        setError(null);

        try {
            const response = await usersApi.store(userId, toAdminUserStorePayload(form));
            const nextForm = adminUserFromResource(response.user, {
                locale: boot.languageCodes[0] ?? 'en',
                timezone: boot.timezone,
            });
            setUser(response.user);
            setForm(nextForm);
            setBaseline(serializeAdminUserForm(nextForm));
            toast.success('User updated.');
            onSaved?.(response.user);
        } catch (saveError) {
            if (saveError instanceof ValidationError) {
                setFieldErrors(saveError.errors);
                toast.error('Please fix the highlighted fields.');
            } else {
                setError('Unable to save this user.');
                toast.error('Unable to save this user.');
            }
        } finally {
            setSaving(false);
        }
    }

    function openRevokeConfirm() {
        if (userId === null || user === null || isSelf || revoking) {
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
        if (userId === null || user === null || isSelf || revoking) {
            return;
        }

        setRevoking(true);

        try {
            await usersApi.destroy(userId);
            setConfirmRevokeOpen(false);
            toast.success(`Access revoked for ${user.name}.`);
            onRevoked?.(user.id);
            onClose();
        } catch {
            toast.error('Unable to revoke access.');
            setRevoking(false);
            setConfirmRevokeOpen(false);
        }
    }

    return (
        <>
            <SideDrawer
                open={open}
                onClose={onClose}
                title={title}
                description="Role, profile, and preferences"
                titleClassName="truncate"
                footer={
                    open && userId !== null ? (
                        <>
                            {showForm && !isSelf ? (
                                <Button
                                    type="button"
                                    outline
                                    color="red"
                                    disabled={revoking || saving || loading}
                                    onClick={openRevokeConfirm}
                                >
                                    Revoke access
                                </Button>
                            ) : (
                                <span />
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" plain disabled={saving || revoking} onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    color="dark/zinc"
                                    disabled={loading || saving || revoking || !isDirty || !showForm}
                                    onClick={() => void handleSave()}
                                >
                                    {saving ? 'Saving…' : 'Save'}
                                </Button>
                            </div>
                        </>
                    ) : undefined
                }
            >
                {loading ? (
                    <div className="space-y-6 px-5 py-5" aria-busy="true">
                        <div className="flex items-center gap-4">
                            <div className="size-14 animate-pulse rounded-full bg-zinc-950/10 dark:bg-white/10" />
                            <div className="min-w-0 flex-1 space-y-2">
                                <div className="h-4 w-32 animate-pulse rounded bg-zinc-950/10 dark:bg-white/10" />
                                <div className="h-3 w-48 animate-pulse rounded bg-zinc-950/10 dark:bg-white/10" />
                            </div>
                        </div>
                        <div className="h-4 w-20 animate-pulse rounded bg-zinc-950/10 dark:bg-white/10" />
                        <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-950/10 dark:bg-white/10" />
                        <div className="h-4 w-16 animate-pulse rounded bg-zinc-950/10 dark:bg-white/10" />
                        <div className="h-24 w-full animate-pulse rounded-lg bg-zinc-950/10 dark:bg-white/10" />
                    </div>
                ) : null}

                {!loading && error !== null && !showForm ? (
                    <div className="px-5 py-8">
                        <ErrorText>{error}</ErrorText>
                    </div>
                ) : null}

                {showForm && form !== null && user !== null ? (
                    <form
                        className="flex flex-1 flex-col"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleSave();
                        }}
                    >
                        <div className="space-y-8 px-5 py-5">
                            {error ? <ErrorText>{error}</ErrorText> : null}

                            <div className="flex items-center gap-4 rounded-2xl border border-zinc-950/10 bg-zinc-950/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                <Avatar
                                    src={user.avatar_url}
                                    initials={userInitials(user.name)}
                                    className="size-14"
                                    alt=""
                                />
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

                            <Fieldset>
                                <Legend>Access</Legend>
                                <FieldGroup>
                                    <Field>
                                        <Label>Role</Label>
                                        <Description>What this person can manage in Canvas.</Description>
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
                                        {isSelf ? (
                                            <Description>You can’t change your own role here.</Description>
                                        ) : null}
                                        {fieldErrors.role?.[0] ? (
                                            <ErrorMessage>{fieldErrors.role[0]}</ErrorMessage>
                                        ) : null}
                                    </Field>
                                </FieldGroup>
                            </Fieldset>

                            <Fieldset>
                                <Legend>Profile</Legend>
                                <FieldGroup>
                                    <Field>
                                        <Label>Username</Label>
                                        <Description>Public handle on the author page.</Description>
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
                                        <Description>A short intro shown with their posts.</Description>
                                        <Textarea
                                            name="summary"
                                            rows={3}
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
                                        <Description>Leave blank to use their host avatar.</Description>
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
                                        {fieldErrors.avatar?.[0] ? (
                                            <ErrorMessage>{fieldErrors.avatar[0]}</ErrorMessage>
                                        ) : null}
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

                            <Fieldset>
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

                            <Fieldset>
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
                                        {fieldErrors.locale?.[0] ? (
                                            <ErrorMessage>{fieldErrors.locale[0]}</ErrorMessage>
                                        ) : null}
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
                                        <Description>Email a summary of site activity.</Description>
                                        <Switch
                                            name="digest"
                                            checked={form.digest}
                                            onChange={(checked) => patchForm({ digest: checked })}
                                            color="dark/zinc"
                                        />
                                    </SwitchField>
                                </FieldGroup>
                            </Fieldset>
                        </div>
                    </form>
                ) : null}
            </SideDrawer>

            <Alert open={confirmRevokeOpen} onClose={closeRevokeConfirm} size="sm">
                <AlertTitle>Revoke access?</AlertTitle>
                <AlertDescription>
                    Revoke Canvas access for {user?.name}? They’ll lose the admin until access is granted again.
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
