import { useEffect, useRef, useState } from 'react';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Avatar } from '@/components/avatar';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { ErrorMessage } from '@/components/fieldset';
import { SideDrawer } from '@/components/SideDrawer';
import { Text, ErrorText } from '@/components/text';
import { AuthorProfileFields } from '@/components/users/AuthorProfileFields';
import { RoleSelectDropdown } from '@/components/users/RoleSelectDropdown';
import { useCanvas } from '@/hooks/useCanvas';
import { ValidationError, type LaravelValidationErrors } from '@/lib/api';
import { usersApi } from '@/lib/api/users';
import type { RoleValue } from '@/lib/permissions';
import {
    adminUserFromResource,
    profileFromUser,
    serializeAdminUserForm,
    serializeProfileForm,
    toAdminUserStorePayload,
    toProfileStorePayload,
    withSerializedProfileLocale,
    type AdminUserFormState,
    type ProfileFormState,
} from '@/lib/settings/profile';
import { toast } from '@/lib/toast';
import { defaultTimezone } from '@/lib/timezones';
import { roleLabel, userInitials } from '@/lib/users/roles';
import type { UserResource } from '@/types/boot';

type UserDetailDrawerProps = {
    open: boolean;
    userId: string | null;
    onClose: () => void;
    onSaved?: (user: UserResource) => void;
    onRevoked?: (userId: number) => void;
};

export function UserDetailDrawer({ open, userId, onClose, onSaved, onRevoked }: UserDetailDrawerProps) {
    const { boot, user: currentUser, t, switchLocale, setUser: setBootUser } = useCanvas();

    const [user, setUser] = useState<UserResource | null>(null);
    const [accessForm, setAccessForm] = useState<AdminUserFormState | null>(null);
    const [profileForm, setProfileForm] = useState<ProfileFormState | null>(null);
    const [baseline, setBaseline] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [revoking, setRevoking] = useState(false);
    const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<LaravelValidationErrors>({});
    const [localeSwitching, setLocaleSwitching] = useState(false);
    const localeAbortRef = useRef<AbortController | null>(null);
    const persistedLocaleRef = useRef<string | null>(null);

    const isSelf = user !== null && user.id === currentUser.id;

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
            setAccessForm(null);
            setProfileForm(null);
            setBaseline('');
            setLocaleSwitching(false);
        });

        usersApi
            .show(userId, controller.signal)
            .then((fresh) => {
                if (cancelled) {
                    return;
                }

                const self = fresh.id === currentUser.id;
                setUser(fresh);

                if (self) {
                    const nextProfile = profileFromUser(fresh, {
                        locale: boot.defaultLocale,
                        timezone: defaultTimezone(boot.appTimezone),
                    });
                    setProfileForm(nextProfile);
                    setAccessForm(null);
                    setBaseline(serializeProfileForm(nextProfile));
                    persistedLocaleRef.current = nextProfile.locale;
                } else {
                    const nextAccess = adminUserFromResource(fresh);
                    setAccessForm(nextAccess);
                    setProfileForm(null);
                    setBaseline(serializeAdminUserForm(nextAccess));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(t('users.load_user_error'));
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
    }, [boot.appTimezone, boot.defaultLocale, currentUser.id, open, t, userId]);

    const isDirty =
        isSelf && profileForm !== null
            ? serializeProfileForm(profileForm) !== baseline
            : accessForm !== null
              ? serializeAdminUserForm(accessForm) !== baseline
              : false;

    const showForm =
        !loading && error === null && user !== null && (isSelf ? profileForm !== null : accessForm !== null);

    const title = loading ? t('users.user_heading') : (user?.name ?? t('users.user_heading'));
    const postsCount = user?.posts_count ?? 0;
    const postsLabel = `${postsCount.toLocaleString()} ${postsCount === 1 ? 'post' : 'posts'}`;
    const roleDisplay = user !== null ? roleLabel(user.canvas?.role ?? null, boot.roles) : null;

    function setRole(role: RoleValue) {
        setAccessForm((current) => (current === null ? current : { ...current, role }));
        setFieldErrors((current) => {
            if (current.role === undefined) {
                return current;
            }

            const next = { ...current };
            delete next.role;
            return next;
        });
    }

    function patchProfile(patch: Partial<ProfileFormState>) {
        setProfileForm((current) => (current === null ? current : { ...current, ...patch }));
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

    async function handleLocaleChange(locale: string) {
        if (userId === null || profileForm === null || !isSelf || saving) {
            return;
        }

        if (locale === profileForm.locale) {
            return;
        }

        const fallbackLocale = persistedLocaleRef.current ?? profileForm.locale;
        const previousBaseline = baseline;

        patchProfile({ locale });
        clearFieldError('locale');
        setBaseline((current) => withSerializedProfileLocale(current, locale));

        localeAbortRef.current?.abort();
        const controller = new AbortController();
        localeAbortRef.current = controller;
        setLocaleSwitching(true);

        try {
            await switchLocale(locale, controller.signal);

            if (controller.signal.aborted) {
                return;
            }

            const response = await usersApi.store(userId, { locale }, controller.signal);

            if (controller.signal.aborted) {
                return;
            }

            persistedLocaleRef.current = locale;
            setUser(response.user);
            setBootUser(response.user);
            onSaved?.(response.user);
        } catch (localeError) {
            if (controller.signal.aborted) {
                return;
            }

            patchProfile({ locale: fallbackLocale });
            setBaseline(withSerializedProfileLocale(previousBaseline, fallbackLocale));

            if (localeError instanceof ValidationError) {
                setFieldErrors(localeError.errors);
            }

            try {
                await switchLocale(fallbackLocale);
            } catch {
                // UI may stay on the attempted locale until the next successful switch or reload.
            }

            toast.error(t('users.save_profile_error'));
        } finally {
            if (localeAbortRef.current === controller) {
                localeAbortRef.current = null;
                setLocaleSwitching(false);
            }
        }
    }

    async function handleSave() {
        if (userId === null || saving || loading || localeSwitching || !showForm) {
            return;
        }

        setSaving(true);
        setFieldErrors({});
        setError(null);

        try {
            if (isSelf && profileForm !== null) {
                const response = await usersApi.store(userId, toProfileStorePayload(profileForm));
                const nextProfile = profileFromUser(response.user, {
                    locale: boot.defaultLocale,
                    timezone: defaultTimezone(boot.appTimezone),
                });
                setUser(response.user);
                setBootUser(response.user);
                setProfileForm(nextProfile);
                setBaseline(serializeProfileForm(nextProfile));
                persistedLocaleRef.current = nextProfile.locale;
                toast.success(t('users.profile_saved'));
                onSaved?.(response.user);
            } else if (!isSelf && accessForm !== null) {
                const response = await usersApi.store(userId, toAdminUserStorePayload(accessForm));
                const nextAccess = adminUserFromResource(response.user);
                setUser(response.user);
                setAccessForm(nextAccess);
                setBaseline(serializeAdminUserForm(nextAccess));
                toast.success(t('users.access_updated'));
                onSaved?.(response.user);
            }
        } catch (saveError) {
            if (saveError instanceof ValidationError) {
                setFieldErrors(saveError.errors);
                toast.error(t('common.please_fix_fields'));
            } else {
                setError(isSelf ? t('users.save_profile_error') : t('users.save_user_error'));
                toast.error(isSelf ? t('users.save_profile_error') : t('users.save_user_error'));
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
            toast.error(t('users.revoke_error'));
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
                description={isSelf ? 'Your author profile' : undefined}
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
                                <Button
                                    type="button"
                                    plain
                                    disabled={saving || revoking || localeSwitching}
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    color="dark/zinc"
                                    disabled={loading || saving || revoking || localeSwitching || !isDirty || !showForm}
                                    onClick={() => void handleSave()}
                                >
                                    {saving ? 'Saving…' : isSelf ? 'Save profile' : 'Save'}
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
                        <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-950/10 dark:bg-white/10" />
                        <div className="h-24 w-full animate-pulse rounded-lg bg-zinc-950/10 dark:bg-white/10" />
                    </div>
                ) : null}

                {!loading && error !== null && !showForm ? (
                    <div className="px-5 py-8">
                        <ErrorText>{error}</ErrorText>
                    </div>
                ) : null}

                {showForm && user !== null ? (
                    <form
                        className="flex flex-1 flex-col"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleSave();
                        }}
                    >
                        <div className="space-y-6 px-5 py-5">
                            {error ? <ErrorText>{error}</ErrorText> : null}

                            <div className="flex items-center gap-4 rounded-2xl border border-zinc-950/10 bg-zinc-950/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                <Avatar
                                    src={
                                        isSelf && profileForm !== null
                                            ? profileForm.avatar.trim() !== ''
                                                ? profileForm.avatar.trim()
                                                : null
                                            : user.avatar_url
                                    }
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
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        {isSelf && roleDisplay && roleDisplay !== 'No access' ? (
                                            <Badge color="zinc">{roleDisplay}</Badge>
                                        ) : null}
                                        <Text className="text-xs text-zinc-400 dark:text-zinc-500">{postsLabel}</Text>
                                    </div>
                                </div>
                            </div>

                            {isSelf && profileForm !== null ? (
                                <AuthorProfileFields
                                    form={profileForm}
                                    fieldErrors={fieldErrors}
                                    languages={boot.languages}
                                    socialEditorKey={baseline}
                                    localeSwitching={localeSwitching}
                                    avatarInitials={userInitials(user.name)}
                                    onPatch={patchProfile}
                                    onLocaleChange={(locale) => {
                                        void handleLocaleChange(locale);
                                    }}
                                    onClearFieldError={clearFieldError}
                                />
                            ) : null}

                            {!isSelf && accessForm !== null ? (
                                <div className="space-y-2">
                                    <Text className="text-sm font-medium text-zinc-950 dark:text-white">Role</Text>
                                    <RoleSelectDropdown
                                        value={accessForm.role}
                                        onChange={setRole}
                                        labels={boot.roles}
                                        invalid={Boolean(fieldErrors.role)}
                                    />
                                    {fieldErrors.role?.[0] ? <ErrorMessage>{fieldErrors.role[0]}</ErrorMessage> : null}
                                </div>
                            ) : null}
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
