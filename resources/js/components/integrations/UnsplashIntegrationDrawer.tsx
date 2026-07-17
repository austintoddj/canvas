import { useEffect, useState } from 'react';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { IntegrationDrawerChrome } from '@/components/integrations/IntegrationDrawerChrome';
import { Input } from '@/components/input';
import { SideDrawer } from '@/components/SideDrawer';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { ValidationError } from '@/lib/api';
import { integrationsApi, type IntegrationsStatus } from '@/lib/api/integrations';
import { UNSPLASH_DEVELOPER } from '@/lib/integrations/ai-providers';
import { toast } from '@/lib/toast';

const externalLinkClass =
    'text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400';

type UnsplashIntegrationDrawerProps = {
    open: boolean;
    configured: boolean;
    maskedKey?: string | null;
    enabledAt?: string | null;
    onClose: () => void;
    onStatusChange: (status: IntegrationsStatus) => void;
};

export function UnsplashIntegrationDrawer({
    open,
    configured,
    maskedKey = null,
    enabledAt = null,
    onClose,
    onStatusChange,
}: UnsplashIntegrationDrawerProps) {
    const { t } = useCanvas();
    const [accessKey, setAccessKey] = useState('');
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);
    const [fieldError, setFieldError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;

        queueMicrotask(() => {
            if (cancelled) {
                return;
            }

            setAccessKey('');
            setFieldError(null);
            setSaving(false);
            setClearing(false);
            setConfirmDisconnectOpen(false);
        });

        return () => {
            cancelled = true;
        };
    }, [open]);

    async function handleSave() {
        if (saving || accessKey.trim() === '') {
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

    function openDisconnectConfirm() {
        if (clearing || saving) {
            return;
        }

        setConfirmDisconnectOpen(true);
    }

    function closeDisconnectConfirm() {
        if (clearing) {
            return;
        }

        setConfirmDisconnectOpen(false);
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

    const busy = saving || clearing;
    const permissions = [
        t(
            'integrations.unsplash_perm_search',
            'Search Unsplash from the post editor and media pickers'
        ),
        t(
            'integrations.unsplash_perm_scope',
            'Photo search only — not account settings or billing'
        ),
        t(
            'integrations.unsplash_perm_encrypted',
            'Stored encrypted; never shown in full after save'
        ),
    ];

    return (
        <>
            <SideDrawer
                open={open}
                onClose={onClose}
                closeLabel={t('common.close')}
                title={t('integrations.unsplash')}
                footer={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            color="dark/zinc"
                            disabled={busy || accessKey.trim() === ''}
                            onClick={() => void handleSave()}
                        >
                            {saving
                                ? t('common.saving')
                                : configured
                                  ? t('integrations.save_key', 'Save key')
                                  : t('integrations.connect_unsplash', 'Connect Unsplash')}
                        </Button>
                        <Button type="button" outline disabled={busy} onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                    </div>
                }
            >
                <IntegrationDrawerChrome
                    kind="unsplash"
                    title={t('integrations.unsplash')}
                    description={t('integrations.unsplash_help')}
                    enabled={configured}
                    enabledAt={enabledAt}
                    developer={UNSPLASH_DEVELOPER}
                    permissions={permissions}
                    dangerZone={
                        configured ? (
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                    <Text className="text-sm font-medium text-zinc-950 dark:text-white">
                                        {t('integrations.disconnect')}
                                    </Text>
                                    <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                        {t(
                                            'integrations.disconnect_help',
                                            'Removes the key and disables this integration.'
                                        )}
                                    </Text>
                                </div>
                                <Button
                                    type="button"
                                    outline
                                    color="red"
                                    disabled={busy}
                                    onClick={openDisconnectConfirm}
                                >
                                    {t('integrations.disconnect')}
                                </Button>
                            </div>
                        ) : null
                    }
                >
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleSave();
                        }}
                    >
                        <Fieldset>
                            <Legend className="sr-only">{t('integrations.unsplash_key')}</Legend>
                            <FieldGroup className="space-y-5">
                                {configured && maskedKey ? (
                                    <Field>
                                        <Label>{t('integrations.current_key', 'Current key')}</Label>
                                        <code
                                            className="mt-2 block max-w-full truncate font-mono text-sm text-zinc-600 dark:text-zinc-400"
                                            data-masked-key="true"
                                        >
                                            {maskedKey}
                                        </code>
                                    </Field>
                                ) : null}
                                <Field>
                                    <Label>{t('integrations.access_key')}</Label>
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
                                    <Input
                                        type="password"
                                        name="unsplash_access_key"
                                        autoComplete="off"
                                        value={accessKey}
                                        placeholder={
                                            configured
                                                ? t(
                                                      'integrations.placeholder_access_key_replace',
                                                      'Paste a new key to replace the current one'
                                                  )
                                                : t(
                                                      'integrations.placeholder_access_key',
                                                      'Paste your Unsplash access key'
                                                  )
                                        }
                                        onChange={(event) => {
                                            setAccessKey(event.target.value);
                                            setFieldError(null);
                                        }}
                                    />
                                    {fieldError ? <ErrorMessage>{fieldError}</ErrorMessage> : null}
                                </Field>
                            </FieldGroup>
                        </Fieldset>
                    </form>
                </IntegrationDrawerChrome>
            </SideDrawer>

            <Alert open={confirmDisconnectOpen} onClose={closeDisconnectConfirm} size="sm">
                <AlertTitle>
                    {t('integrations.disconnect_unsplash_title', 'Disconnect Unsplash?')}
                </AlertTitle>
                <AlertDescription>
                    {t(
                        'integrations.disconnect_unsplash_body',
                        'Removes the access key. Unsplash search will stop until you reconnect.'
                    )}
                </AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={clearing} onClick={closeDisconnectConfirm}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="button" color="red" disabled={clearing} onClick={() => void confirmDisconnect()}>
                        {clearing
                            ? t('integrations.disconnecting', 'Disconnecting…')
                            : t('integrations.disconnect')}
                    </Button>
                </AlertActions>
            </Alert>
        </>
    );
}
