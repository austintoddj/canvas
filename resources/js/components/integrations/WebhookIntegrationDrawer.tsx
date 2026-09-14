import { useEffect, useMemo, useState } from 'react';

import { Alert, AlertActions, AlertBody, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { CopyableInput } from '@/components/integrations/CopyableInput';
import { WebhookEventsField } from '@/components/integrations/WebhookEventsField';
import { WebhookLogsPreview } from '@/components/integrations/WebhookLogsPreview';
import { Input } from '@/components/input';
import { SideDrawer } from '@/components/SideDrawer';
import { useCanvas } from '@/hooks/useCanvas';
import { ApiError, ValidationError, apiErrorCode } from '@/lib/api';
import { notifyWebhookTestError } from '@/lib/integrations/webhook-test-error';
import { integrationsApi, type IntegrationsStatus, type WebhookEventOption } from '@/lib/api/integrations';
import { toast } from '@/lib/toast';

type WebhookIntegrationDrawerProps = {
    open: boolean;
    configured: boolean;
    pending?: boolean;
    url?: string | null;
    maskedSecret?: string | null;
    events?: string[];
    availableEvents?: WebhookEventOption[];
    onClose: () => void;
    onStatusChange: (status: IntegrationsStatus) => void;
    onDeliveriesChange?: () => void;
};

/** One dialog: confirm rotate → reveal secret (also used after first save). */
type SecretDialog =
    { step: 'closed' } | { step: 'confirm' } | { step: 'reveal'; secret: string; reason: 'rotate' | 'create' };

const DEFAULT_EVENTS: WebhookEventOption[] = [
    { id: 'post.published', label: 'Published', description: 'When a draft or scheduled post goes live.' },
    { id: 'post.scheduled', label: 'Scheduled', description: 'When a future publish date is set on a post.' },
    { id: 'post.updated', label: 'Updated', description: 'When a live or scheduled post’s public content changes.' },
    { id: 'post.unpublished', label: 'Unpublished', description: 'When a post leaves public or scheduled visibility.' },
    { id: 'post.deleted', label: 'Deleted', description: 'When a post is removed.' },
];

export function WebhookIntegrationDrawer({
    open,
    configured,
    pending = false,
    url: initialUrl = null,
    maskedSecret = null,
    events: initialEvents = [],
    availableEvents = DEFAULT_EVENTS,
    onClose,
    onStatusChange,
    onDeliveriesChange,
}: WebhookIntegrationDrawerProps) {
    const { t } = useCanvas();
    const [url, setUrl] = useState(initialUrl ?? '');
    const [events, setEvents] = useState<string[]>(() => {
        const options = availableEvents.length > 0 ? availableEvents : DEFAULT_EVENTS;
        return initialEvents.length > 0 ? initialEvents : options.map((option) => option.id);
    });
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [rotating, setRotating] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);
    const [secretDialog, setSecretDialog] = useState<SecretDialog>({ step: 'closed' });
    const [logsRefreshKey, setLogsRefreshKey] = useState(0);
    const [fieldErrors, setFieldErrors] = useState<{
        url?: string;
        events?: string;
    }>({});

    function bumpDeliveries() {
        setLogsRefreshKey((key) => key + 1);
        onDeliveriesChange?.();
    }

    // Hydrate when the drawer opens. Parent status updates (after save/rotate)
    // pass new events/availableEvents array references — resetting on those deps
    // was wiping one-time secret UI before the user could copy it.
    useEffect(() => {
        let cancelled = false;

        queueMicrotask(() => {
            if (cancelled) {
                return;
            }

            if (!open) {
                setFieldErrors({});
                setSaving(false);
                setTesting(false);
                setRotating(false);
                setClearing(false);
                setConfirmDisconnectOpen(false);
                setSecretDialog({ step: 'closed' });
                return;
            }

            setUrl(initialUrl ?? '');
            const options = availableEvents.length > 0 ? availableEvents : DEFAULT_EVENTS;
            setEvents(initialEvents.length > 0 ? initialEvents : options.map((option) => option.id));
            setFieldErrors({});
            setSaving(false);
            setTesting(false);
            setRotating(false);
            setClearing(false);
            setConfirmDisconnectOpen(false);
            setSecretDialog({ step: 'closed' });
        });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- open-only reset; read latest props when opening
    }, [open]);

    const eventOptions = useMemo(() => {
        if (availableEvents.length > 0) {
            return availableEvents;
        }

        return DEFAULT_EVENTS;
    }, [availableEvents]);

    const busy = saving || testing || rotating || clearing;
    const trimmedUrl = url.trim();
    const hasCredentials = configured || pending;
    const canCreate = trimmedUrl !== '' && events.length > 0;
    const canSave =
        canCreate && hasCredentials && (trimmedUrl !== (initialUrl ?? '') || !sameEventSet(events, initialEvents));
    const secretDialogOpen = secretDialog.step !== 'closed';

    function closeSecretDialog() {
        if (rotating) {
            return;
        }

        setSecretDialog({ step: 'closed' });
    }

    function webhookFieldErrors(): boolean {
        if (trimmedUrl === '') {
            setFieldErrors({ url: t('integrations.webhooks_url_required', 'A webhook URL is required.') });
            return true;
        }

        if (events.length === 0) {
            setFieldErrors({
                events: t('integrations.webhooks_events_required', 'Select at least one event.'),
            });
            return true;
        }

        return false;
    }

    async function persistWebhook() {
        return integrationsApi.update({
            webhooks: {
                url: trimmedUrl,
                events,
            },
        });
    }

    async function handleCreate() {
        if (testing || hasCredentials || webhookFieldErrors()) {
            return;
        }

        setTesting(true);
        setFieldErrors({});

        try {
            const next = await persistWebhook();
            onStatusChange(next);

            const nextPlain =
                typeof next.webhooks.plain_secret === 'string' && next.webhooks.plain_secret !== ''
                    ? next.webhooks.plain_secret
                    : null;

            if (nextPlain !== null) {
                setSecretDialog({ step: 'reveal', secret: nextPlain, reason: 'create' });
            }
        } catch (error) {
            if (error instanceof ValidationError) {
                setFieldErrors({
                    url: error.errors['webhooks.url']?.[0],
                    events: error.errors['webhooks.events']?.[0],
                });
                toast.error(t('common.please_fix_fields'));
            } else if (
                error instanceof ApiError &&
                (apiErrorCode(error) === 'webhooks_test_failed' || error.status === 502)
            ) {
                notifyWebhookTestError(error, t);
            } else {
                toast.error(t('integrations.webhooks_save_error', 'Unable to save webhook settings.'));
            }
        } finally {
            setTesting(false);
            bumpDeliveries();
        }
    }

    async function handleSave() {
        if (saving || !hasCredentials || webhookFieldErrors()) {
            return;
        }

        setSaving(true);
        setFieldErrors({});

        try {
            const next = await persistWebhook();
            onStatusChange(next);
            toast.success(t('integrations.webhooks_saved', 'Webhook settings saved.'));
            onClose();
        } catch (error) {
            if (error instanceof ValidationError) {
                setFieldErrors({
                    url: error.errors['webhooks.url']?.[0],
                    events: error.errors['webhooks.events']?.[0],
                });
                toast.error(t('common.please_fix_fields'));
            } else if (
                error instanceof ApiError &&
                (apiErrorCode(error) === 'webhooks_test_failed' || error.status === 502)
            ) {
                notifyWebhookTestError(error, t);
            } else {
                toast.error(t('integrations.webhooks_save_error', 'Unable to save webhook settings.'));
            }
        } finally {
            setSaving(false);
            bumpDeliveries();
        }
    }

    async function confirmRotateSecret() {
        if (rotating || !hasCredentials) {
            return;
        }

        setRotating(true);
        setFieldErrors({});

        try {
            const next = await integrationsApi.update({
                webhooks: { rotate_secret: true },
            });
            onStatusChange(next);

            const nextPlain =
                typeof next.webhooks.plain_secret === 'string' && next.webhooks.plain_secret !== ''
                    ? next.webhooks.plain_secret
                    : null;

            if (nextPlain === null) {
                toast.error(t('integrations.webhooks_rotate_error', 'Unable to rotate the signing secret.'));
                return;
            }

            setSecretDialog({ step: 'reveal', secret: nextPlain, reason: 'rotate' });
        } catch {
            toast.error(t('integrations.webhooks_rotate_error', 'Unable to rotate the signing secret.'));
        } finally {
            setRotating(false);
        }
    }

    async function handleTest() {
        if (testing || !hasCredentials) {
            return;
        }

        setTesting(true);

        try {
            await integrationsApi.testWebhook();
            const next = await integrationsApi.show();
            onStatusChange(next);
            toast.success(t('integrations.webhooks_test_sent', 'Test webhook sent.'));
        } catch (error) {
            notifyWebhookTestError(error, t);
        } finally {
            setTesting(false);
            bumpDeliveries();
        }
    }

    async function confirmDisconnect() {
        if (clearing) {
            return;
        }

        setClearing(true);
        setFieldErrors({});

        try {
            const next = await integrationsApi.update({
                webhooks: { url: null },
            });
            onStatusChange(next);
            setSecretDialog({ step: 'closed' });
            setConfirmDisconnectOpen(false);
            toast.success(t('integrations.webhooks_disconnected', 'Webhooks disconnected.'));
            onClose();
        } catch {
            setClearing(false);
            setConfirmDisconnectOpen(false);
            toast.error(t('integrations.webhooks_disconnect_error', 'Unable to disconnect webhooks.'));
        }
    }

    async function copySecret() {
        if (secretDialog.step !== 'reveal' || typeof navigator.clipboard?.writeText !== 'function') {
            return;
        }

        try {
            await navigator.clipboard.writeText(secretDialog.secret);
            toast.success(t('integrations.webhooks_secret_copied', 'Signing secret copied.'));
        } catch {
            toast.error(t('integrations.webhooks_secret_copy_error', 'Unable to copy the signing secret.'));
        }
    }

    return (
        <>
            <SideDrawer
                open={open}
                onClose={onClose}
                title={
                    hasCredentials
                        ? t('integrations.webhooks_settings', 'Webhook settings')
                        : t('integrations.webhooks_add', 'Add a webhook')
                }
                closeLabel={t('common.close')}
                footer={
                    open ? (
                        <>
                            {hasCredentials ? (
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
                                {hasCredentials ? (
                                    <Button
                                        type="button"
                                        color="dark/zinc"
                                        disabled={busy || !canSave}
                                        onClick={() => void handleSave()}
                                    >
                                        {saving ? t('common.saving') : t('common.save')}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        color="dark/zinc"
                                        disabled={busy || !canCreate}
                                        onClick={() => void handleCreate()}
                                    >
                                        {testing
                                            ? t('integrations.webhooks_testing', 'Sending…')
                                            : t('integrations.webhooks_send_test', 'Send test')}
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
                        if (hasCredentials) {
                            void handleSave();
                        } else {
                            void handleCreate();
                        }
                    }}
                >
                    <div className="space-y-6 px-5 py-5">
                        <Fieldset>
                            <Legend className="sr-only">
                                {t('integrations.webhooks_settings', 'Webhook settings')}
                            </Legend>
                            <FieldGroup>
                                <Field>
                                    <Label>{t('integrations.webhooks_url', 'Endpoint URL')}</Label>
                                    <Input
                                        type="url"
                                        name="webhook_url"
                                        autoComplete="off"
                                        value={url}
                                        placeholder="https://example.com/hooks/canvas"
                                        onChange={(event) => {
                                            setUrl(event.target.value);
                                            setFieldErrors((current) => ({ ...current, url: undefined }));
                                        }}
                                        data-webhook-url="true"
                                    />
                                    {fieldErrors.url ? <ErrorMessage>{fieldErrors.url}</ErrorMessage> : null}
                                </Field>

                                <Field>
                                    <Label>{t('integrations.webhooks_events', 'Events')}</Label>
                                    <WebhookEventsField
                                        options={eventOptions}
                                        value={events}
                                        onChange={(next) => {
                                            setEvents(next);
                                            setFieldErrors((current) => ({ ...current, events: undefined }));
                                        }}
                                        disabled={busy}
                                        invalid={Boolean(fieldErrors.events)}
                                    />
                                    {fieldErrors.events ? <ErrorMessage>{fieldErrors.events}</ErrorMessage> : null}
                                </Field>

                                {hasCredentials ? (
                                    <Field>
                                        <Label>{t('integrations.webhooks_secret', 'Signing secret')}</Label>
                                        <CopyableInput
                                            name="webhook_signing_secret"
                                            value={maskedSecret ?? ''}
                                            readOnly
                                            disabled={busy}
                                            data-masked-secret="true"
                                        />
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <Button
                                                type="button"
                                                outline
                                                disabled={busy}
                                                onClick={() => void handleTest()}
                                            >
                                                {testing
                                                    ? t('integrations.webhooks_testing', 'Sending…')
                                                    : t('integrations.webhooks_send_test', 'Send test')}
                                            </Button>
                                            <Button
                                                type="button"
                                                outline
                                                disabled={busy}
                                                onClick={() => setSecretDialog({ step: 'confirm' })}
                                                data-webhook-rotate-secret="true"
                                            >
                                                {t('integrations.webhooks_rotate_secret', 'Rotate secret')}
                                            </Button>
                                        </div>
                                    </Field>
                                ) : null}

                                <WebhookLogsPreview open={open} refreshKey={logsRefreshKey} />
                            </FieldGroup>
                        </Fieldset>
                    </div>
                </form>
            </SideDrawer>

            <Alert
                open={secretDialogOpen}
                onClose={closeSecretDialog}
                size={secretDialog.step === 'reveal' ? 'md' : 'sm'}
            >
                {secretDialog.step === 'confirm' ? (
                    <>
                        <AlertTitle>{t('integrations.webhooks_rotate_title', 'Rotate signing secret?')}</AlertTitle>
                        <AlertDescription>
                            {t('integrations.webhooks_rotate_body', 'The new secret is shown once.')}
                        </AlertDescription>
                        <AlertActions>
                            <Button type="button" plain disabled={rotating} onClick={closeSecretDialog}>
                                {t('common.cancel')}
                            </Button>
                            <Button
                                type="button"
                                color="dark/zinc"
                                disabled={rotating}
                                onClick={() => void confirmRotateSecret()}
                                data-webhook-rotate-confirm="true"
                            >
                                {rotating
                                    ? t('integrations.webhooks_rotating', 'Rotating…')
                                    : t('integrations.webhooks_rotate_secret', 'Rotate secret')}
                            </Button>
                        </AlertActions>
                    </>
                ) : null}

                {secretDialog.step === 'reveal' ? (
                    <>
                        <AlertTitle>
                            {secretDialog.reason === 'rotate'
                                ? t('integrations.webhooks_secret_rotated', 'Signing secret rotated.')
                                : t('integrations.webhooks_secret', 'Signing secret')}
                        </AlertTitle>
                        <AlertDescription>
                            {t(
                                'integrations.webhooks_secret_once_help',
                                "Copy this and save it somewhere. You won't see it again."
                            )}
                        </AlertDescription>
                        <AlertBody>
                            <code
                                className="block break-all rounded-lg border border-zinc-950/10 bg-zinc-50 px-3 py-2.5 font-mono text-xs leading-5 text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                                data-webhook-plain-secret="true"
                            >
                                {secretDialog.secret}
                            </code>
                        </AlertBody>
                        <AlertActions>
                            <Button
                                type="button"
                                outline
                                onClick={() => void copySecret()}
                                data-webhook-copy-secret="true"
                            >
                                {t('integrations.webhooks_copy_secret', 'Copy secret')}
                            </Button>
                            <Button
                                type="button"
                                color="dark/zinc"
                                onClick={closeSecretDialog}
                                data-webhook-secret-done="true"
                            >
                                {t('common.close')}
                            </Button>
                        </AlertActions>
                    </>
                ) : null}
            </Alert>

            <Alert open={confirmDisconnectOpen} onClose={() => !clearing && setConfirmDisconnectOpen(false)} size="sm">
                <AlertTitle>{t('integrations.disconnect_webhooks_title', 'Disconnect webhook?')}</AlertTitle>
                <AlertDescription>
                    {t('integrations.disconnect_webhooks_body', 'Stops outbound delivery.')}
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

function sameEventSet(left: string[], right: string[]): boolean {
    if (left.length !== right.length) {
        return false;
    }

    const rightSet = new Set(right);

    return left.every((id) => rightSet.has(id));
}
