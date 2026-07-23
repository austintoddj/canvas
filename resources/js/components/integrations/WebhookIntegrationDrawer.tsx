import { useEffect, useMemo, useState } from 'react';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
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

const DEFAULT_EVENTS: WebhookEventOption[] = [
    { id: 'post.published', label: 'Published' },
    { id: 'post.scheduled', label: 'Scheduled' },
    { id: 'post.updated', label: 'Updated' },
    { id: 'post.unpublished', label: 'Unpublished' },
    { id: 'post.deleted', label: 'Deleted' },
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
    const [plainSecret, setPlainSecret] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [rotating, setRotating] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{
        url?: string;
        events?: string;
    }>({});

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
            setPlainSecret(null);
            setFieldErrors({});
            setSaving(false);
            setTesting(false);
            setRotating(false);
            setClearing(false);
            setConfirmDisconnectOpen(false);
        });

        return () => {
            cancelled = true;
        };
    }, [open, initialUrl, initialEvents, availableEvents]);

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

    const aboutItems = [
        t(
            'integrations.webhooks_about_outbound',
            'Canvas queues a POST for the events you select when a post is published, updated, unpublished, or deleted'
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

            if (typeof next.webhooks.plain_secret === 'string' && next.webhooks.plain_secret !== '') {
                setPlainSecret(next.webhooks.plain_secret);
                toast.success(
                    configured
                        ? t('integrations.webhooks_saved', 'Webhook settings saved.')
                        : t('integrations.webhooks_connected', 'Webhooks connected.')
                );
            } else {
                setPlainSecret(null);
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

    async function handleRotateSecret() {
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

            if (typeof next.webhooks.plain_secret === 'string') {
                setPlainSecret(next.webhooks.plain_secret);
            }

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
            setPlainSecret(null);
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
        if (!plainSecret || typeof navigator.clipboard?.writeText !== 'function') {
            return;
        }

        try {
            await navigator.clipboard.writeText(plainSecret);
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
                        'Notify external services when posts are published, updated, or deleted.'
                    )}
                    enabled={configured}
                    enabledAt={enabledAt}
                    permissions={aboutItems}
                    permissionsTitle={t('integrations.webhooks_about', 'How it works')}
                    permissionsHelp={t(
                        'integrations.webhooks_about_help',
                        'Lifecycle events use your app queue (same idea as the weekly digest). Send test runs immediately so you can verify the URL.'
                    )}
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
                                {plainSecret ? (
                                    <div
                                        className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 dark:border-amber-400/30 dark:bg-amber-400/10"
                                        data-webhook-plain-secret="true"
                                    >
                                        <Text className="text-sm font-medium text-zinc-950 dark:text-white">
                                            {t('integrations.webhooks_secret_once_title', 'Copy your signing secret')}
                                        </Text>
                                        <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                            {t(
                                                'integrations.webhooks_secret_once_help',
                                                'This is shown once. Store it with your receiver to verify Canvas-Signature headers.'
                                            )}
                                        </Text>
                                        <code className="mt-1 block break-all font-mono text-xs text-zinc-800 dark:text-zinc-200">
                                            {plainSecret}
                                        </code>
                                        <Button
                                            type="button"
                                            outline
                                            className="mt-1"
                                            onClick={() => void copySecret()}
                                        >
                                            {t('integrations.webhooks_copy_secret', 'Copy secret')}
                                        </Button>
                                    </div>
                                ) : null}

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
                                    {fieldErrors.events ? <ErrorMessage>{fieldErrors.events}</ErrorMessage> : null}
                                </Field>

                                {configured ? (
                                    <Field>
                                        <Label>{t('integrations.webhooks_secret', 'Signing secret')}</Label>
                                        {maskedSecret ? (
                                            <code
                                                className="mt-2 block max-w-full truncate font-mono text-sm text-zinc-600 dark:text-zinc-400"
                                                data-masked-secret="true"
                                            >
                                                {maskedSecret}
                                            </code>
                                        ) : null}
                                        <Description>
                                            {t(
                                                'integrations.webhooks_secret_help',
                                                'Used to sign Canvas-Signature headers. Rotate if the secret may be compromised.'
                                            )}
                                        </Description>
                                        <Button
                                            type="button"
                                            outline
                                            className="mt-2"
                                            disabled={busy}
                                            onClick={() => void handleRotateSecret()}
                                        >
                                            {rotating
                                                ? t('integrations.webhooks_rotating', 'Rotating…')
                                                : t('integrations.webhooks_rotate_secret', 'Rotate secret')}
                                        </Button>
                                    </Field>
                                ) : null}
                            </FieldGroup>
                        </Fieldset>
                    </form>
                </IntegrationDrawerChrome>
            </SideDrawer>

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
