import { useEffect, useState } from 'react';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { AiModelDropdown } from '@/components/integrations/AiModelDropdown';
import { AiProviderDropdown } from '@/components/integrations/AiProviderDropdown';
import { IntegrationDrawerChrome } from '@/components/integrations/IntegrationDrawerChrome';
import { IntegrationPageLayout, IntegrationSummarySep } from '@/components/integrations/IntegrationPageLayout';
import { AiProviderIcon } from '@/components/integrations/provider-icons';
import { Input } from '@/components/input';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { ValidationError } from '@/lib/api';
import { integrationsApi, type AiProviderValue, type IntegrationsStatus } from '@/lib/api/integrations';
import { aiProviderOption, modelIdForTier, resolveModelTier, type AiModelTier } from '@/lib/integrations/ai-providers';
import { toast } from '@/lib/toast';

const externalLinkClass =
    'text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400';

type AiIntegrationDrawerProps = {
    configured: boolean;
    provider: AiProviderValue | null;
    model: string | null;
    maskedKey?: string | null;
    enabledAt?: string | null;
    onClose: () => void;
    onStatusChange: (status: IntegrationsStatus) => void;
};

export function AiIntegrationDrawer({
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
        // Mount-only hydrate from initial status props (page loads status before render).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** Connected provider is fixed until disconnect; draft connect uses the picker. */
    const activeProvider = configured ? initialProvider : provider;
    const activeOption = aiProviderOption(activeProvider);
    const busy = saving || clearing;

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
                model: t('integrations.model_custom_required', 'Enter a model id, or choose Default.'),
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

    const modelTierLabel =
        modelTier === 'custom'
            ? t('integrations.model_tier_custom', 'Custom')
            : modelTier === 'fast'
              ? t('integrations.model_tier_fast', 'Fast')
              : modelTier === 'expert'
                ? t('integrations.model_tier_expert', 'Expert')
                : t('integrations.model_tier_auto', 'Default');

    return (
        <>
            <IntegrationPageLayout
                kind="ai"
                title={t('integrations.ai')}
                description={t('integrations.ai_help', 'Rewrite and SEO tools with Grok, ChatGPT, or Claude.')}
                enabled={configured}
                enabledAt={enabledAt}
                developer={configured ? (activeOption?.developer ?? null) : null}
                summary={
                    configured && activeOption ? (
                        <>
                            <span
                                className="inline-flex min-w-0 items-center gap-2"
                                data-ai-provider-summary={activeOption.value}
                            >
                                <AiProviderIcon
                                    provider={activeOption.value}
                                    className="size-4 shrink-0 text-zinc-700 dark:text-zinc-200"
                                />
                                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                                    {activeOption.label}
                                </span>
                            </span>
                            <IntegrationSummarySep />
                            <span data-ai-summary-model="true">{modelTierLabel}</span>
                            {maskedKey ? (
                                <>
                                    <IntegrationSummarySep />
                                    <code
                                        className="min-w-0 max-w-[12rem] truncate font-mono text-xs text-zinc-500 dark:text-zinc-400"
                                        data-masked-key="true"
                                    >
                                        {maskedKey}
                                    </code>
                                </>
                            ) : null}
                        </>
                    ) : null
                }
            >
                <IntegrationDrawerChrome
                    permissions={permissions}
                    aboutDefaultOpen={!configured}
                    settingsDescription={
                        configured
                            ? t(
                                  'integrations.ai_settings_connected_help',
                                  'Replace the API key or change the model tier. Leave the key blank to keep the current one.'
                              )
                            : t(
                                  'integrations.ai_settings_setup_help',
                                  'Choose a provider, paste an API key, and pick a model tier.'
                              )
                    }
                    actions={
                        <>
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
                        </>
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
                            <FieldGroup className="space-y-4">
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

                                <Field>
                                    <Label>
                                        {configured
                                            ? t('integrations.api_key_replace', 'Replace API key')
                                            : t('integrations.api_key')}
                                    </Label>
                                    <Description>
                                        {configured ? (
                                            t(
                                                'integrations.api_key_replace_help',
                                                'Optional. Paste a new key only when rotating credentials.'
                                            )
                                        ) : (
                                            <>
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
                                            </>
                                        )}
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
                                    {!configured ? (
                                        <Description>
                                            {t(
                                                'integrations.model_tier_help',
                                                'Default and Fast use the provider’s default model id. Expert uses a higher-capacity SKU (slower, better quality). Custom accepts any model id from the provider API.'
                                            )}
                                        </Description>
                                    ) : null}
                                    <div className={configured ? undefined : 'mt-3'}>
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
                        <Text className="mt-3 text-sm text-canvas-muted dark:text-canvas-muted-dark">
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
            </IntegrationPageLayout>

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
