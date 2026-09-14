import { useEffect, useState } from 'react';

import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/alert';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { AiModelDropdown } from '@/components/integrations/AiModelDropdown';
import { AiProviderDropdown } from '@/components/integrations/AiProviderDropdown';
import { CopyableInput } from '@/components/integrations/CopyableInput';
import { Input } from '@/components/input';
import { SideDrawer } from '@/components/SideDrawer';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { ValidationError } from '@/lib/api';
import { integrationsApi, type AiProviderValue, type IntegrationsStatus } from '@/lib/api/integrations';
import { aiProviderOption, modelIdForTier, resolveModelTier, type AiModelTier } from '@/lib/integrations/ai-providers';
import { toast } from '@/lib/toast';

const externalLinkClass =
    'text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400';

type AiIntegrationDrawerProps = {
    open: boolean;
    configured: boolean;
    provider: AiProviderValue | null;
    model: string | null;
    maskedKey?: string | null;
    onClose: () => void;
    onStatusChange: (status: IntegrationsStatus) => void;
};

export function AiIntegrationDrawer({
    open,
    configured,
    provider: initialProvider,
    model: initialModel,
    maskedKey = null,
    onClose,
    onStatusChange,
}: AiIntegrationDrawerProps) {
    const { t } = useCanvas();
    const [provider, setProvider] = useState<AiProviderValue | null>(initialProvider);
    const [apiKey, setApiKey] = useState(() => (configured ? (maskedKey ?? '') : ''));
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

            if (!open) {
                setFieldErrors({});
                setSaving(false);
                setClearing(false);
                setConfirmDisconnectOpen(false);
                return;
            }

            const tier = resolveModelTier(initialProvider, initialModel);

            setProvider(initialProvider);
            setApiKey(configured ? (maskedKey ?? '') : '');
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
        // Hydrate when the drawer opens. Parent status updates pass new
        // provider/model references — resetting on those deps would wipe in-progress edits.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

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
        const masked = (maskedKey ?? '').trim();
        const keyReplaced = key !== '' && key !== masked;
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

            if (!configured || keyReplaced) {
                payload.ai = { ...payload.ai, api_key: key !== '' ? key : null };
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

    const trimmedKey = apiKey.trim();
    const masked = (maskedKey ?? '').trim();
    const keyReplaced = trimmedKey !== '' && trimmedKey !== masked;
    const saveDisabled =
        busy ||
        (!configured && trimmedKey === '') ||
        (!configured && provider === null) ||
        (configured && !keyReplaced && modelUnchanged);

    return (
        <>
            <SideDrawer
                open={open}
                onClose={onClose}
                title={configured ? t('integrations.ai_settings') : t('integrations.connect_ai', 'Connect AI')}
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
                                    disabled={saveDisabled}
                                    onClick={() => void handleSave()}
                                >
                                    {saving
                                        ? configured
                                            ? t('common.saving')
                                            : t('integrations.connecting_progress', 'Connecting…')
                                        : configured
                                          ? t('common.save')
                                          : t('integrations.connect_ai', 'Connect AI')}
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
                            <Legend className="sr-only">{t('integrations.ai_settings')}</Legend>
                            <FieldGroup>
                                <Field>
                                    <Label>{t('integrations.api_key')}</Label>
                                    {!configured ? (
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
                                    ) : null}
                                    <CopyableInput
                                        name="ai_api_key"
                                        value={apiKey}
                                        placeholder={t('integrations.placeholder_api_key', 'Paste your API key')}
                                        disabled={busy}
                                        invalid={Boolean(fieldErrors.api_key)}
                                        onChange={(next) => {
                                            setApiKey(next);
                                            setFieldErrors((current) => ({ ...current, api_key: undefined }));
                                        }}
                                        data-ai-api-key="true"
                                    />
                                    {fieldErrors.api_key ? <ErrorMessage>{fieldErrors.api_key}</ErrorMessage> : null}
                                </Field>

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

                                {activeOption ? (
                                    <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
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
                            </FieldGroup>
                        </Fieldset>
                    </div>
                </form>
            </SideDrawer>

            <Alert open={confirmDisconnectOpen} onClose={() => !clearing && setConfirmDisconnectOpen(false)} size="sm">
                <AlertTitle>{t('integrations.disconnect_ai_title', 'Disconnect AI writing?')}</AlertTitle>
                <AlertDescription>
                    {t(
                        'integrations.disconnect_ai_body',
                        'Removes the API key and provider. Rewrite and SEO tools stop until you reconnect. To use a different provider, disconnect here, then connect again.'
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
