import { useEffect, useState } from 'react';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { CopyableInput } from '@/components/integrations/CopyableInput';
import { SideDrawer } from '@/components/SideDrawer';
import { useCanvas } from '@/hooks/useCanvas';
import { ValidationError } from '@/lib/api';
import { integrationsApi, type IntegrationsStatus } from '@/lib/api/integrations';
import { toast } from '@/lib/toast';

const externalLinkClass =
    'text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400';

type UnsplashIntegrationDrawerProps = {
    open: boolean;
    configured: boolean;
    maskedKey?: string | null;
    onClose: () => void;
    onStatusChange: (status: IntegrationsStatus) => void;
};

export function UnsplashIntegrationDrawer({
    open,
    configured,
    maskedKey = null,
    onClose,
    onStatusChange,
}: UnsplashIntegrationDrawerProps) {
    const { t } = useCanvas();
    const [accessKey, setAccessKey] = useState(() => (configured ? (maskedKey ?? '') : ''));
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);
    const [fieldError, setFieldError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        queueMicrotask(() => {
            if (cancelled) {
                return;
            }

            if (!open) {
                setFieldError(null);
                setSaving(false);
                setClearing(false);
                setConfirmDisconnectOpen(false);
                return;
            }

            setAccessKey(configured ? (maskedKey ?? '') : '');
            setFieldError(null);
            setSaving(false);
            setClearing(false);
            setConfirmDisconnectOpen(false);
        });

        return () => {
            cancelled = true;
        };
        // Hydrate when the drawer opens. Parent status updates pass a new
        // maskedKey — resetting on that dep would wipe an in-progress replacement.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const busy = saving || clearing;
    const trimmedKey = accessKey.trim();
    const initialKey = configured ? (maskedKey ?? '').trim() : '';
    const canSave = trimmedKey !== '' && trimmedKey !== initialKey;

    async function handleSave() {
        if (saving || !canSave) {
            return;
        }

        setSaving(true);
        setFieldError(null);

        try {
            const next = await integrationsApi.update({
                unsplash: { access_key: accessKey.trim() },
            });
            onStatusChange(next);
            setAccessKey('');
            toast.success(t('integrations.unsplash_connected'));
            onClose();
        } catch (error) {
            if (error instanceof ValidationError) {
                const message = error.errors['unsplash.access_key']?.[0] ?? t('common.please_fix_fields');
                setFieldError(message);
                toast.error(t('common.please_fix_fields'));
            } else {
                toast.error(t('integrations.unsplash_save_error'));
            }
        } finally {
            setSaving(false);
        }
    }

    async function confirmDisconnect() {
        if (clearing) {
            return;
        }

        setClearing(true);
        setFieldError(null);

        try {
            const next = await integrationsApi.update({
                unsplash: { access_key: null },
            });
            onStatusChange(next);
            setAccessKey('');
            setConfirmDisconnectOpen(false);
            toast.success(t('integrations.unsplash_disconnected'));
            onClose();
        } catch {
            setClearing(false);
            setConfirmDisconnectOpen(false);
            toast.error(t('integrations.unsplash_disconnect_error'));
        }
    }

    return (
        <>
            <SideDrawer
                open={open}
                onClose={onClose}
                title={
                    configured
                        ? t('integrations.unsplash_settings', 'Unsplash settings')
                        : t('integrations.connect_unsplash', 'Connect Unsplash')
                }
                closeLabel={t('common.close')}
                footer={
                    open ? (
                        <>
                            {configured ? (
                                <Button
                                    type="button"
                                    outline
                                    color="red"
                                    disabled={busy}
                                    onClick={() => setConfirmDisconnectOpen(true)}
                                >
                                    {t('integrations.disconnect')}
                                </Button>
                            ) : (
                                <span />
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" plain disabled={busy} onClick={onClose}>
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="button"
                                    color="dark/zinc"
                                    disabled={busy || !canSave}
                                    onClick={() => void handleSave()}
                                >
                                    {saving
                                        ? configured
                                            ? t('common.saving')
                                            : t('integrations.connecting_progress', 'Connecting…')
                                        : configured
                                          ? t('common.save')
                                          : t('integrations.connect_unsplash', 'Connect Unsplash')}
                                </Button>
                            </div>
                        </>
                    ) : undefined
                }
            >
                <form
                    className="flex flex-1 flex-col"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleSave();
                    }}
                >
                    <div className="space-y-6 px-5 py-5">
                        <Fieldset>
                            <Legend className="sr-only">{t('integrations.unsplash_key')}</Legend>
                            <FieldGroup>
                                <Field>
                                    <Label>{t('integrations.access_key')}</Label>
                                    {!configured ? (
                                        <Description>
                                            Create an app at{' '}
                                            <a
                                                href="https://unsplash.com/oauth/applications"
                                                target="_blank"
                                                rel="noreferrer"
                                                className={externalLinkClass}
                                            >
                                                unsplash.com/oauth/applications
                                            </a>
                                            . Demo apps are limited to 50 requests/hour.
                                        </Description>
                                    ) : null}
                                    <CopyableInput
                                        name="unsplash_access_key"
                                        value={accessKey}
                                        placeholder={t(
                                            'integrations.placeholder_access_key',
                                            'Paste your Unsplash access key'
                                        )}
                                        disabled={busy}
                                        invalid={Boolean(fieldError)}
                                        onChange={(next) => {
                                            setAccessKey(next);
                                            setFieldError(null);
                                        }}
                                        data-unsplash-access-key="true"
                                    />
                                    {fieldError ? <ErrorMessage>{fieldError}</ErrorMessage> : null}
                                </Field>
                            </FieldGroup>
                        </Fieldset>
                    </div>
                </form>
            </SideDrawer>

            <Alert open={confirmDisconnectOpen} onClose={() => !clearing && setConfirmDisconnectOpen(false)} size="sm">
                <AlertTitle>{t('integrations.disconnect_unsplash_title', 'Disconnect Unsplash?')}</AlertTitle>
                <AlertDescription>
                    {t(
                        'integrations.disconnect_unsplash_body',
                        'Removes the access key. Unsplash search will stop until you reconnect.'
                    )}
                </AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={clearing} onClick={() => setConfirmDisconnectOpen(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="button" color="red" disabled={clearing} onClick={() => void confirmDisconnect()}>
                        {clearing ? t('integrations.disconnecting', 'Disconnecting…') : t('integrations.disconnect')}
                    </Button>
                </AlertActions>
            </Alert>
        </>
    );
}
