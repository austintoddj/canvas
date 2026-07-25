import { useEffect, useMemo, useState } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';

import { Alert, AlertActions, AlertBody, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { IntegrationDrawerChrome } from '@/components/integrations/IntegrationDrawerChrome';
import { WebhookEventsField } from '@/components/integrations/WebhookEventsField';
import { Input } from '@/components/input';
import { SideDrawer } from '@/components/SideDrawer';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { ApiError, ValidationError, apiErrorCode } from '@/lib/api';
import { integrationsApi, type IntegrationsStatus, type WebhookEventOption } from '@/lib/api/integrations';
import { toast } from '@/lib/toast';

type WebhookIntegrationDrawerProps = {
    open: boolean;
    configured: boolean;
    url?: string | null;
    maskedSecret?: string | null;
    events?: string[];
    availableEvents?: WebhookEventOption[];
    enabledAt?: string | null;
    onClose: () => void;
    onStatusChange: (status: IntegrationsStatus) => void;
};

/** One dialog: confirm rotate → reveal secret (also used after first enable). */
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
    url: initialUrl = null,
    maskedSecret = null,
    events: initialEvents = [],
    availableEvents = DEFAULT_EVENTS,
    enabledAt = null,
    onClose,
    onStatusChange,
}: WebhookIntegrationDrawerProps) {
    const { t } = useCanvas();
    const [url, setUrl] = useState(initialUrl ?? '');
    const [events, setEvents] = useState<string[]>(initialEvents);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [rotating, setRotating] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);
    const [secretDialog, setSecretDialog] = useState<SecretDialog>({ step: 'closed' });
    const [fieldErrors, setFieldErrors] = useState<{
        url?: string;
        events?: string;
    }>({});

    // Hydrate form state only when the drawer opens. Parent status updates (after
    // save/rotate) pass new events/availableEvents array references — resetting on
    // those deps was wiping one-time secret UI before the user could copy it.
    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;

        queueMicrotask(() => {
            if (cancelled) {
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
    const canSave =
        trimmedUrl !== '' &&
        events.length > 0 &&
        (!configured || trimmedUrl !== (initialUrl ?? '') || !sameEventSet(events, initialEvents));
    const secretDialogOpen = secretDialog.step !== 'closed';

    const aboutItems = [
        t(
            'integrations.webhooks_about_outbound',
            'Canvas queues a POST for the events you select when a post is published, scheduled, updated, unpublished, or deleted'
        ),
        t(
            'integrations.webhooks_about_signed',
            'Each request is signed with your secret so receivers can verify Canvas-Signature'
        ),
        t(
            'integrations.webhooks_about_payload',
            'Payloads include metadata only (title, slug, author, …) — never the full post body'
        ),
        t(
            'integrations.webhooks_about_https',
            'Your endpoint must be a public HTTPS URL (localhost and private IPs are blocked)'
        ),
        t(
            'integrations.webhooks_about_queue',
            'With Redis, database, or SQS queues, run a queue worker (php artisan queue:work). The default sync driver needs no worker.'
        ),
    ];

    function closeSecretDialog() {
        if (rotating) {
            return;
        }

        setSecretDialog({ step: 'closed' });
    }

    async function handleSave() {
        if (saving) {
            return;
        }

        if (trimmedUrl === '') {
            setFieldErrors({ url: t('integrations.webhooks_url_required', 'A webhook URL is required.') });
            return;
        }

        if (events.length === 0) {
            setFieldErrors({
                events: t('integrations.webhooks_events_required', 'Select at least one event.'),
            });
            return;
        }

        setSaving(true);
        setFieldErrors({});

        try {
            const next = await integrationsApi.update({
                webhooks: {
                    url: trimmedUrl,
                    events,
                },
            });
            onStatusChange(next);

            const nextPlain =
                typeof next.webhooks.plain_secret === 'string' && next.webhooks.plain_secret !== ''
                    ? next.webhooks.plain_secret
                    : null;

            if (nextPlain !== null) {
                setSecretDialog({ step: 'reveal', secret: nextPlain, reason: 'create' });
                toast.success(
                    configured
                        ? t('integrations.webhooks_saved', 'Webhook settings saved.')
                        : t('integrations.webhooks_connected', 'Webhooks connected.')
                );
            } else {
                toast.success(t('integrations.webhooks_saved', 'Webhook settings saved.'));
                onClose();
            }
        } catch (error) {
            if (error instanceof ValidationError) {
                setFieldErrors({
                    url: error.errors['webhooks.url']?.[0],
                    events: error.errors['webhooks.events']?.[0],
                });
                toast.error(t('common.please_fix_fields'));
            } else {
                toast.error(t('integrations.webhooks_save_error', 'Unable to save webhook settings.'));
            }
        } finally {
            setSaving(false);
        }
    }

    async function confirmRotateSecret() {
        if (rotating || !configured) {
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

            // Stay in the same dialog — morph confirm → reveal.
            setSecretDialog({ step: 'reveal', secret: nextPlain, reason: 'rotate' });
            toast.success(t('integrations.webhooks_secret_rotated', 'Signing secret rotated.'));
        } catch {
            toast.error(t('integrations.webhooks_rotate_error', 'Unable to rotate the signing secret.'));
        } finally {
            setRotating(false);
        }
    }

    async function handleTest() {
        if (testing || !configured) {
            return;
        }

        setTesting(true);

        try {
            await integrationsApi.testWebhook();
            toast.success(t('integrations.webhooks_test_sent', 'Test webhook sent.'));
        } catch (error) {
            if (error instanceof ApiError) {
                const code = apiErrorCode(error);

                if (code === 'webhooks_not_configured') {
                    toast.error(t('integrations.webhooks_not_configured', 'Configure webhooks before sending a test.'));
                } else if (code === 'webhooks_test_failed' || error.status === 502) {
                    toast.error(t('integrations.webhooks_test_failed', 'The test webhook could not be delivered.'));
                } else {
                    toast.error(t('integrations.webhooks_test_error', 'Unable to send a test webhook.'));
                }
            } else {
                toast.error(t('integrations.webhooks_test_error', 'Unable to send a test webhook.'));
            }
        } finally {
            setTesting(false);
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
                closeLabel={t('common.close')}
                title={t('integrations.webhooks', 'Webhooks')}
                footer={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            color="dark/zinc"
                            disabled={busy || !canSave}
                            onClick={() => void handleSave()}
                        >
                            {saving
                                ? t('common.saving')
                                : configured
                                  ? t('integrations.save_settings', 'Save settings')
                                  : t('integrations.webhooks_connect', 'Enable webhooks')}
                        </Button>
                        {configured ? (
                            <Button type="button" outline disabled={busy} onClick={() => void handleTest()}>
                                {testing
                                    ? t('integrations.webhooks_testing', 'Sending…')
                                    : t('integrations.webhooks_send_test', 'Send test')}
                            </Button>
                        ) : null}
                        <Button type="button" outline disabled={busy} onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                    </div>
                }
            >
                <IntegrationDrawerChrome
                    kind="webhooks"
                    title={t('integrations.webhooks', 'Webhooks')}
                    description={t(
                        'integrations.webhooks_help',
                        'Notify external services when posts are published, scheduled, updated, or deleted.'
                    )}
                    enabled={configured}
                    enabledAt={enabledAt}
                    permissions={aboutItems}
                    permissionsTitle={t('integrations.webhooks_about', 'How it works')}
                    permissionsHelp={t(
                        'integrations.webhooks_about_help',
                        'Lifecycle events use your app queue (same idea as the weekly digest). Send test runs immediately so you can verify the URL.'
                    )}
                    cautionZoneTitle={configured ? t('integrations.webhooks_secret', 'Signing secret') : undefined}
                    cautionZone={
                        configured ? (
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 space-y-1">
                                    {maskedSecret ? (
                                        <code
                                            className="block max-w-full truncate font-mono text-sm text-zinc-600 dark:text-zinc-400"
                                            data-masked-secret="true"
                                        >
                                            {maskedSecret}
                                        </code>
                                    ) : null}
                                    <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                        {t(
                                            'integrations.webhooks_secret_help',
                                            'Used to sign Canvas-Signature headers. Rotate if the secret may be compromised.'
                                        )}
                                    </Text>
                                </div>
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
                        ) : null
                    }
                    dangerZone={
                        configured ? (
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                    <Text className="text-sm font-medium text-zinc-950 dark:text-white">
                                        {t('integrations.disconnect')}
                                    </Text>
                                    <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                        {t(
                                            'integrations.webhooks_disconnect_help',
                                            'Removes the URL, signing secret, and event subscriptions.'
                                        )}
                                    </Text>
                                </div>
                                <Button
                                    type="button"
                                    outline
                                    color="red"
                                    disabled={busy}
                                    onClick={() => setConfirmDisconnectOpen(true)}
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
                            <Legend className="sr-only">
                                {t('integrations.webhooks_settings', 'Webhook settings')}
                            </Legend>
                            <FieldGroup className="space-y-5">
                                <Field>
                                    <Label>{t('integrations.webhooks_url', 'Endpoint URL')}</Label>
                                    <Description>
                                        {t(
                                            'integrations.webhooks_url_help',
                                            'Public HTTPS URL that accepts POST requests (Zapier, Make, n8n, or your own API).'
                                        )}
                                    </Description>
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
                                    <Description>
                                        {t(
                                            'integrations.webhooks_events_help',
                                            'Choose which post lifecycle events to send.'
                                        )}
                                    </Description>
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
                                    <div
                                        className="mt-3 flex gap-2.5 rounded-lg border border-zinc-950/10 bg-zinc-50/80 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]"
                                        data-webhook-events-scheduled-note="true"
                                    >
                                        <IconInfoCircle
                                            className="mt-0.5 size-4 shrink-0 text-zinc-500 dark:text-zinc-400"
                                            aria-hidden="true"
                                        />
                                        <p className="min-w-0 text-sm/5 text-zinc-600 dark:text-zinc-400">
                                            {t(
                                                'integrations.webhooks_events_scheduled_note',
                                                'A post that goes live only because its scheduled time arrived does not send Published. Subscribe to Scheduled for when the date is set.'
                                            )}
                                        </p>
                                    </div>
                                    {fieldErrors.events ? <ErrorMessage>{fieldErrors.events}</ErrorMessage> : null}
                                </Field>
                            </FieldGroup>
                        </Fieldset>
                    </form>
                </IntegrationDrawerChrome>
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
                            {t(
                                'integrations.webhooks_rotate_body',
                                'A new secret is generated and shown once. Receivers must update their verification key or Canvas-Signature checks will fail until they do.'
                            )}
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
                                : t('integrations.webhooks_secret_once_title', 'Copy your signing secret')}
                        </AlertTitle>
                        <AlertDescription>
                            {t(
                                'integrations.webhooks_secret_once_help',
                                'This is shown once. Store it with your receiver to verify Canvas-Signature headers.'
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
                <AlertTitle>{t('integrations.disconnect_webhooks_title', 'Disconnect webhooks?')}</AlertTitle>
                <AlertDescription>
                    {t(
                        'integrations.disconnect_webhooks_body',
                        'Removes the endpoint URL, signing secret, and event subscriptions. Outbound delivery stops until you reconnect.'
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

function sameEventSet(left: string[], right: string[]): boolean {
    if (left.length !== right.length) {
        return false;
    }

    const rightSet = new Set(right);

    return left.every((id) => rightSet.has(id));
}
