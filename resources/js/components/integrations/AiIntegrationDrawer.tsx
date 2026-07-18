import { useEffect, useState } from 'react';
import { IconClock } from '@tabler/icons-react';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { AiModelDropdown } from '@/components/integrations/AiModelDropdown';
import { AiProviderDropdown } from '@/components/integrations/AiProviderDropdown';
import { IntegrationDrawerChrome } from '@/components/integrations/IntegrationDrawerChrome';
import { AiProviderIcon } from '@/components/integrations/provider-icons';
import { Input } from '@/components/input';
import { SideDrawer } from '@/components/SideDrawer';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { ValidationError } from '@/lib/api';
import { integrationsApi, type AiProviderValue, type IntegrationsStatus } from '@/lib/api/integrations';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { aiProviderOption, modelIdForTier, resolveModelTier, type AiModelTier } from '@/lib/integrations/ai-providers';
import { toast } from '@/lib/toast';

const externalLinkClass =
    'text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400';

const developerLinkClass =
    'font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400';

type AiIntegrationDrawerProps = {
    open: boolean;
    configured: boolean;
    provider: AiProviderValue | null;
    model: string | null;
    maskedKey?: string | null;
    enabledAt?: string | null;
    onClose: () => void;
    onStatusChange: (status: IntegrationsStatus) => void;
};

export function AiIntegrationDrawer({
    open,
    configured,
    provider: initialProvider,
    model: initialModel,
    maskedKey = null,
    enabledAt = null,
    onClose,
    onStatusChange,
}: AiIntegrationDrawerProps) {
    const { t } = useCanvas();
    const [provider, setProvider] = useState<AiProviderValue | null>(initialProvider);
    const [apiKey, setApiKey] = useState('');
    const [modelTier, setModelTier] = useState<AiModelTier>(() => resolveModelTier(initialProvider, initialModel));
    const [customModel, setCustomModel] = useState(() =>
        resolveModelTier(initialProvider, initialModel) === 'custom' ? (initialModel ?? '') : ''
    );
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{
        provider?: string;
        api_key?: string;
        model?: string;
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

            const tier = resolveModelTier(initialProvider, initialModel);

            setProvider(initialProvider);
            setApiKey('');
            setModelTier(tier);
            setCustomModel(tier === 'custom' ? (initialModel ?? '') : '');
            setFieldErrors({});
            setSaving(false);
            setClearing(false);
            setConfirmDisconnectOpen(false);
        });

        return () => {
            cancelled = true;
        };
    }, [open, initialProvider, initialModel]);

    /** Connected provider is fixed until disconnect; draft connect uses the picker. */
    const activeProvider = configured ? initialProvider : provider;
    const activeOption = aiProviderOption(activeProvider);
    const busy = saving || clearing;
    const relativeEnabled = configured ? formatRelativeTime(enabledAt) : null;
    const enabledAgo =
        relativeEnabled === null
            ? null
            : t('integrations.enabled_ago', { relative: relativeEnabled }, 'Enabled :relative');
    const developedByPrefix = t('integrations.developed_by_prefix', 'Developed by');

    const nextModelId = modelIdForTier(activeProvider, modelTier, customModel);
    const initialModelId = initialModel?.trim() ? initialModel.trim() : null;
    const modelUnchanged = nextModelId === initialModelId;

    async function handleSave() {
        if (saving) {
            return;
        }

        const key = apiKey.trim();
        const nextModel = nextModelId;
        const nextProvider = configured ? initialProvider : provider;

        if (!configured && key === '') {
            setFieldErrors({ api_key: t('integrations.api_key_required', 'An API key is required.') });
            return;
        }

        if (!configured && nextProvider === null) {
            setFieldErrors({ provider: t('integrations.provider_required', 'Choose a provider.') });
            return;
        }

        if (modelTier === 'custom' && (nextModel === null || nextModel === '')) {
            setFieldErrors({
                model: t('integrations.model_custom_required', 'Enter a model id, or choose Auto.'),
            });
            return;
        }

        if (configured && key === '' && modelUnchanged) {
            onClose();
            return;
        }

        setSaving(true);
        setFieldErrors({});

        try {
            const payload: Parameters<typeof integrationsApi.update>[0] = {
                ai: {
                    provider: nextProvider,
                    model: nextModel,
                },
            };

            if (key !== '') {
                payload.ai = { ...payload.ai, api_key: key };
            } else if (!configured) {
                payload.ai = { ...payload.ai, api_key: null };
            }

            const next = await integrationsApi.update(payload);
            onStatusChange(next);
            setApiKey('');
            toast.success(
                configured
                    ? t('integrations.ai_saved', 'AI settings saved.')
                    : t('integrations.ai_connected', 'AI writing connected.')
            );
            onClose();
        } catch (error) {
            if (error instanceof ValidationError) {
                setFieldErrors({
                    provider: error.errors['ai.provider']?.[0],
                    api_key: error.errors['ai.api_key']?.[0],
                    model: error.errors['ai.model']?.[0],
                });
                toast.error(t('common.please_fix_fields'));
            } else {
                toast.error(t('integrations.ai_save_error'));
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
        setFieldErrors({});

        try {
            const next = await integrationsApi.update({
                ai: { api_key: null },
            });
            onStatusChange(next);
            setApiKey('');
            setConfirmDisconnectOpen(false);
            toast.success(t('integrations.ai_disconnected'));
            onClose();
        } catch {
            setClearing(false);
            setConfirmDisconnectOpen(false);
            toast.error(t('integrations.ai_disconnect_error'));
        }
    }

    const saveDisabled =
        busy ||
        (apiKey.trim() === '' && !configured) ||
        (!configured && provider === null) ||
        (apiKey.trim() === '' && configured && modelUnchanged);

    const permissions = [
        t(
            'integrations.ai_perm_rewrite',
            'Send selected text for rewrites (improve, grammar, shorten, expand, custom)'
        ),
        t('integrations.ai_perm_seo', 'Send title and summary for SEO suggestions — never the full post'),
        t('integrations.ai_perm_billing', 'Billed to your provider account — Canvas only stores the key'),
        t('integrations.ai_perm_encrypted', 'Stored encrypted; never shown in full after save'),
    ];

    return (
        <>
            <SideDrawer
                open={open}
                onClose={onClose}
                closeLabel={t('common.close')}
                title={t('integrations.ai')}
                footer={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            color="dark/zinc"
                            disabled={saveDisabled}
                            onClick={() => void handleSave()}
                        >
                            {saving
                                ? t('common.saving')
                                : configured
                                  ? t('integrations.save_settings', 'Save settings')
                                  : t('integrations.connect_ai', 'Connect AI')}
                        </Button>
                        <Button type="button" outline disabled={busy} onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                    </div>
                }
            >
                <IntegrationDrawerChrome
                    kind="ai"
                    title={t('integrations.ai')}
                    description={t('integrations.ai_help', 'Rewrite and SEO tools with Grok, ChatGPT, or Claude.')}
                    enabled={configured}
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
                                            'integrations.disconnect_ai_help',
                                            'Removes the key and provider. Disconnect first if you want to switch providers.'
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
                            <Legend className="sr-only">{t('integrations.ai_settings')}</Legend>
                            <FieldGroup className="space-y-5">
                                {configured && activeOption ? (
                                    <div
                                        className="flex min-w-0 items-start gap-3 rounded-lg border border-zinc-950/10 bg-zinc-950/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.02]"
                                        data-ai-provider-summary={activeOption.value}
                                    >
                                        <span
                                            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:ring-white/10"
                                            aria-hidden="true"
                                        >
                                            <AiProviderIcon
                                                provider={activeOption.value}
                                                className="size-5 text-zinc-800 dark:text-zinc-100"
                                            />
                                        </span>
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <Text className="text-sm font-semibold text-zinc-950 dark:text-white">
                                                {activeOption.label}
                                            </Text>
                                            {enabledAgo || activeOption.developer ? (
                                                <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                    {enabledAgo ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <IconClock
                                                                className="size-3.5 shrink-0 opacity-70"
                                                                aria-hidden="true"
                                                            />
                                                            <span>{enabledAgo}</span>
                                                        </span>
                                                    ) : null}
                                                    {enabledAgo && activeOption.developer ? (
                                                        <span
                                                            className="text-zinc-300 dark:text-zinc-600"
                                                            aria-hidden="true"
                                                        >
                                                            ·
                                                        </span>
                                                    ) : null}
                                                    {activeOption.developer ? (
                                                        <span className="min-w-0">
                                                            {developedByPrefix}{' '}
                                                            <a
                                                                href={activeOption.developer.websiteUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className={developerLinkClass}
                                                            >
                                                                {activeOption.developer.name}
                                                            </a>
                                                        </span>
                                                    ) : null}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}

                                {!configured ? (
                                    <Field>
                                        <Label>{t('integrations.ai_provider')}</Label>
                                        <div className="mt-3">
                                            <AiProviderDropdown
                                                value={provider}
                                                onChange={(value) => {
                                                    setProvider(value);
                                                    setModelTier('auto');
                                                    setCustomModel('');
                                                    setFieldErrors((current) => ({
                                                        ...current,
                                                        provider: undefined,
                                                        model: undefined,
                                                    }));
                                                }}
                                                disabled={busy}
                                                invalid={Boolean(fieldErrors.provider)}
                                                emptyLabel={t('integrations.select_provider', 'Select a provider')}
                                            />
                                        </div>
                                        {fieldErrors.provider ? (
                                            <ErrorMessage>{fieldErrors.provider}</ErrorMessage>
                                        ) : null}
                                    </Field>
                                ) : null}

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
                                    <Label>{t('integrations.api_key')}</Label>
                                    <Description>
                                        Create a key at{' '}
                                        {activeOption ? (
                                            <a
                                                href={activeOption.consoleUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={externalLinkClass}
                                            >
                                                {activeOption.consoleLabel}
                                            </a>
                                        ) : (
                                            'your provider console'
                                        )}
                                        .
                                    </Description>
                                    <Input
                                        type="password"
                                        name="ai_api_key"
                                        autoComplete="off"
                                        value={apiKey}
                                        placeholder={
                                            configured
                                                ? t(
                                                      'integrations.placeholder_api_key_replace',
                                                      'Paste a new key to replace the current one'
                                                  )
                                                : t('integrations.placeholder_api_key', 'Paste your API key')
                                        }
                                        onChange={(event) => {
                                            setApiKey(event.target.value);
                                            setFieldErrors((current) => ({ ...current, api_key: undefined }));
                                        }}
                                    />
                                    {fieldErrors.api_key ? <ErrorMessage>{fieldErrors.api_key}</ErrorMessage> : null}
                                </Field>

                                <Field>
                                    <Label>{t('integrations.model')}</Label>
                                    <Description>
                                        {t(
                                            'integrations.model_tier_help',
                                            'Auto and Fast use the provider’s default model id. Expert uses a higher-capacity SKU (slower, better quality). Custom accepts any model id from the provider API.'
                                        )}
                                    </Description>
                                    <div className="mt-3">
                                        <AiModelDropdown
                                            provider={activeProvider}
                                            value={modelTier}
                                            onChange={(tier) => {
                                                setModelTier(tier);
                                                if (tier !== 'custom') {
                                                    setCustomModel('');
                                                }
                                                setFieldErrors((current) => ({ ...current, model: undefined }));
                                            }}
                                            disabled={busy || activeProvider === null}
                                            invalid={Boolean(fieldErrors.model)}
                                            t={t}
                                        />
                                    </div>
                                    {modelTier === 'custom' ? (
                                        <div className="mt-3">
                                            <Input
                                                type="text"
                                                name="ai_model"
                                                autoComplete="off"
                                                value={customModel}
                                                placeholder={
                                                    activeOption?.defaultModel ??
                                                    t('integrations.provider_default', 'Provider default')
                                                }
                                                onChange={(event) => {
                                                    setCustomModel(event.target.value);
                                                    setFieldErrors((current) => ({ ...current, model: undefined }));
                                                }}
                                            />
                                        </div>
                                    ) : null}
                                    {fieldErrors.model ? <ErrorMessage>{fieldErrors.model}</ErrorMessage> : null}
                                </Field>
                            </FieldGroup>
                        </Fieldset>
                    </form>

                    {activeOption ? (
                        <Text className="mt-4 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                            {t('integrations.ai_usage_help', 'Usage and billing:')}{' '}
                            <a
                                href={activeOption.usageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={externalLinkClass}
                            >
                                {activeOption.usageLabel}
                            </a>
                        </Text>
                    ) : null}
                </IntegrationDrawerChrome>
            </SideDrawer>

            <Alert open={confirmDisconnectOpen} onClose={closeDisconnectConfirm} size="sm">
                <AlertTitle>{t('integrations.disconnect_ai_title', 'Disconnect AI writing?')}</AlertTitle>
                <AlertDescription>
                    {t(
                        'integrations.disconnect_ai_body',
                        'Removes the API key and provider. Rewrite and SEO tools stop until you reconnect. To use a different provider, disconnect here, then connect again.'
                    )}
                </AlertDescription>
                <AlertActions>
                    <Button type="button" plain disabled={clearing} onClick={closeDisconnectConfirm}>
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
