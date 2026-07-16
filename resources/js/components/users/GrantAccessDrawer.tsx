import { useEffect, useState } from 'react';

import { Avatar } from '@/components/avatar';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { Input } from '@/components/input';
import { SideDrawer } from '@/components/SideDrawer';
import { Text, ErrorText } from '@/components/text';
import { RoleSelectDropdown } from '@/components/users/RoleSelectDropdown';
import { useCanvas } from '@/hooks/useCanvas';
import { ApiError, ValidationError } from '@/lib/api';
import { usersApi } from '@/lib/api/users';
import { Role, type RoleValue } from '@/lib/permissions';
import { toast } from '@/lib/toast';
import {
    canGrantAccess,
    canSubmitLookup,
    emptyGrantAccessForm,
    grantAccessPayload,
    normalizeLookupIdentifier,
    roleLabelFromHost,
} from '@/lib/users/grant';
import { userInitials } from '@/lib/users/roles';
import type { UserLookupResult } from '@/types/api';
import type { UserResource } from '@/types/boot';

type GrantAccessDrawerProps = {
    open: boolean;
    onClose: () => void;
    onGranted?: (user: UserResource) => void;
    onOpenExisting?: (userId: number) => void;
};

export function GrantAccessDrawer({ open, onClose, onGranted, onOpenExisting }: GrantAccessDrawerProps) {
    const { boot, t } = useCanvas();

    const [identifier, setIdentifier] = useState('');
    const [role, setRole] = useState<RoleValue>(Role.Contributor);
    const [host, setHost] = useState<UserLookupResult | null>(null);
    const [lookingUp, setLookingUp] = useState(false);
    const [granting, setGranting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (!open) {
            return;
        }

        const blank = emptyGrantAccessForm();
        queueMicrotask(() => {
            setIdentifier(blank.identifier);
            setRole(blank.role);
            setHost(null);
            setLookingUp(false);
            setGranting(false);
            setError(null);
            setFieldErrors({});
        });
    }, [open]);

    async function handleLookup() {
        const q = normalizeLookupIdentifier(identifier);

        if (!canSubmitLookup(q) || lookingUp || granting) {
            return;
        }

        setLookingUp(true);
        setError(null);
        setFieldErrors({});
        setHost(null);

        try {
            const result = await usersApi.lookup({ q });
            setHost(result);
            setIdentifier(result.email || String(result.id));
        } catch (lookupError) {
            if (lookupError instanceof ValidationError) {
                setFieldErrors(lookupError.errors);
                setError(null);
            } else if (lookupError instanceof ApiError && lookupError.status === 404) {
                setError(t('users.lookup_not_found'));
            } else {
                setError(t('users.lookup_error'));
            }
        } finally {
            setLookingUp(false);
        }
    }

    async function handleGrant() {
        if (!canGrantAccess(host, granting) || host === null) {
            return;
        }

        setGranting(true);
        setError(null);
        setFieldErrors({});

        try {
            const response = await usersApi.store(String(host.id), grantAccessPayload(role));
            toast.success(
                t('users.invited', { name: response.user.name, role: boot.roles[role] ?? t('users.member_fallback') })
            );
            onGranted?.(response.user);
            onClose();
        } catch (grantError) {
            if (grantError instanceof ValidationError) {
                setFieldErrors(grantError.errors);
                toast.error(t('common.please_fix_fields'));
            } else {
                setError(t('users.invite_error'));
                toast.error(t('users.invite_error'));
            }
        } finally {
            setGranting(false);
        }
    }

    function handleOpenExisting() {
        if (host === null || !host.has_canvas_access) {
            return;
        }

        onOpenExisting?.(host.id);
        onClose();
    }

    const showHost = host !== null;

    return (
        <SideDrawer
            open={open}
            onClose={onClose}
            title={t('users.invite_title')}
            footer={
                open ? (
                    <>
                        <span />
                        <div className="flex flex-wrap items-center gap-2">
                            <Button type="button" plain disabled={lookingUp || granting} onClick={onClose}>
                                {t('common.cancel')}
                            </Button>
                            {showHost && host.has_canvas_access ? (
                                <Button
                                    type="button"
                                    color="dark/zinc"
                                    disabled={lookingUp || granting}
                                    onClick={handleOpenExisting}
                                >
                                    {t('users.open_existing')}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    color="dark/zinc"
                                    disabled={!canGrantAccess(host, granting) || lookingUp}
                                    onClick={() => void handleGrant()}
                                >
                                    {granting ? t('users.granting') : t('users.invite')}
                                </Button>
                            )}
                        </div>
                    </>
                ) : undefined
            }
        >
            <form
                className="flex flex-1 flex-col"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (showHost && !host.has_canvas_access) {
                        void handleGrant();
                    } else {
                        void handleLookup();
                    }
                }}
            >
                <div className="space-y-8 px-5 py-5">
                    {error ? <ErrorText>{error}</ErrorText> : null}

                    <Fieldset>
                        <Legend>{t('users.host_account')}</Legend>
                        <FieldGroup>
                            <Field>
                                <Label>{t('users.email_or_id')}</Label>
                                <Description>{t('users.email_or_id_help_long')}</Description>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                    <div className="min-w-0 flex-1">
                                        <Input
                                            name="identifier"
                                            value={identifier}
                                            onChange={(event) => {
                                                setIdentifier(event.target.value);
                                                setHost(null);
                                                setError(null);
                                                setFieldErrors((current) => {
                                                    if (current.q === undefined) {
                                                        return current;
                                                    }

                                                    const next = { ...current };
                                                    delete next.q;
                                                    return next;
                                                });
                                            }}
                                            invalid={Boolean(fieldErrors.q)}
                                            placeholder="writer@example.com"
                                            autoComplete="off"
                                            disabled={lookingUp || granting}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        outline
                                        disabled={!canSubmitLookup(identifier) || lookingUp || granting}
                                        onClick={() => void handleLookup()}
                                    >
                                        {lookingUp ? t('users.looking_up') : t('users.lookup')}
                                    </Button>
                                </div>
                                {fieldErrors.q?.[0] ? <ErrorMessage>{fieldErrors.q[0]}</ErrorMessage> : null}
                            </Field>
                        </FieldGroup>
                    </Fieldset>

                    {showHost ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 rounded-2xl border border-zinc-950/10 bg-zinc-950/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                <Avatar
                                    src={host.avatar_url}
                                    initials={userInitials(host.name)}
                                    className="size-14"
                                    alt=""
                                />
                                <div className="min-w-0">
                                    <Text className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                                        {host.name}
                                    </Text>
                                    <Text className="mt-0.5 truncate text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                        {host.email}
                                    </Text>
                                    <div className="mt-2">
                                        {host.has_canvas_access ? (
                                            <Badge color="blue">
                                                {t('users.already_has_access', {
                                                    role: roleLabelFromHost(host, boot.roles),
                                                })}
                                            </Badge>
                                        ) : (
                                            <Badge color="zinc">{t('users.empty_headline')}</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {host.has_canvas_access ? (
                                <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                    {t('users.already_access_help')}
                                </Text>
                            ) : (
                                <Field>
                                    <Label>{t('users.role')}</Label>
                                    <Description>{t('users.role_help')}</Description>
                                    <div className="mt-3">
                                        <RoleSelectDropdown
                                            value={role}
                                            onChange={setRole}
                                            labels={boot.roles}
                                            disabled={granting}
                                            invalid={Boolean(fieldErrors.role)}
                                        />
                                    </div>
                                    {fieldErrors.role?.[0] ? <ErrorMessage>{fieldErrors.role[0]}</ErrorMessage> : null}
                                </Field>
                            )}
                        </div>
                    ) : null}
                </div>
            </form>
        </SideDrawer>
    );
}
