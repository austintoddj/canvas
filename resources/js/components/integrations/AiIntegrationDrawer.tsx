import { SparklesIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { AiProviderDropdown } from '@/components/integrations/AiProviderDropdown';
import { AiProviderIcon } from '@/components/integrations/provider-icons';
import { Input } from '@/components/input';
import { SideDrawer } from '@/components/SideDrawer';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { ValidationError } from '@/lib/api';
import { integrationsApi, type AiProviderValue, type IntegrationsStatus } from '@/lib/api/integrations';
import { aiProviderOption } from '@/lib/integrations/ai-providers';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

const externalLinkClass =
    'text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400';

type AiIntegrationDrawerProps = {
    open: boolean;
    configured: boolean;
    provider: AiProviderValue | null;
    model: string | null;
    onClose: () => void;
    onStatusChange: (status: IntegrationsStatus) => void;
};

export function AiIntegrationDrawer({
    open,
    configured,
    provider: initialProvider,
    model: initialModel,
    onClose,
    onStatusChange,
}: AiIntegrationDrawerProps) {
    const { t } = useCanvas();
    const [provider, setProvider] = useState<AiProviderValue | null>(initialProvider);
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState(initialModel ?? '');
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
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

            setProvider(initialProvider);
            setApiKey('');
            setModel(initialModel ?? '');
            setFieldErrors({});
            setSaving(false);
            setClearing(false);
        });

        return () => {
            cancelled = true;
        };
    }, [open, initialProvider, initialModel]);

    const selectedOption = aiProviderOption(provider);
    const heroProvider = provider ?? initialProvider;
    const heroOption = aiProviderOption(heroProvider);
    const busy = saving || clearing;
    const displayModel = configured && initialModel ? initialModel : null;

    async function handleSave() {
        if (saving) {
            return;
        }

        const key = apiKey.trim();
        const nextModel = model.trim();

        if (!configured && key === '') {
            setFieldErrors({ api_key: t('integrations.api_key_required', 'An API key is required.') });
            return;
        }

        if (key !== '' && provider === null) {
            setFieldErrors({ provider: t('integrations.provider_required', 'Choose a provider.') });
            return;
        }

        if (key === '' && nextModel === (initialModel ?? '') && provider === initialProvider) {
            onClose();
            return;
        }

        setSaving(true);
        setFieldErrors({});

        try {
            const payload: Parameters<typeof integrationsApi.update>[0] = {
                ai: {
                    provider,
                    model: nextModel === '' ? null : nextModel,
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

    async function handleClear() {
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
            toast.success(t('integrations.ai_disconnected'));
            onClose();
        } catch {
            toast.error(t('integrations.ai_disconnect_error'));
        } finally {
            setClearing(false);
        }
    }

    const saveDisabled =
        busy ||
        (apiKey.trim() === '' && !configured) ||
        (apiKey.trim() === '' && configured && provider === initialProvider && model.trim() === (initialModel ?? ''));

    return (
        <SideDrawer
            open={open}
            onClose={onClose}
            closeLabel={t('common.close')}
            title={t('integrations.ai')}
            footer={
                <>
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
                    {configured ? (
                        <Button
                            type="button"
                            outline
                            color="red"
                            disabled={busy}
                            onClick={() => void handleClear()}
                        >
                            {clearing
                                ? t('integrations.disconnecting', 'Disconnecting…')
                                : t('integrations.disconnect')}
                        </Button>
                    ) : null}
                </>
            }
        >
            <div className="space-y-8 px-5 py-5">
                <div className="flex flex-col items-center gap-4 text-center">
                    <span
                        className={cn(
                            'inline-flex size-20 items-center justify-center rounded-2xl ring-1 ring-inset',
                            'bg-gradient-to-br from-violet-500/15 via-indigo-500/10 to-fuchsia-500/10 ring-violet-500/15',
                            'dark:from-violet-400/20 dark:via-indigo-400/15 dark:to-fuchsia-400/10 dark:ring-white/10'
                        )}
                        aria-hidden="true"
                        data-ai-provider-hero={heroProvider ?? 'none'}
                    >
                        {heroOption ? (
                            <AiProviderIcon
                                provider={heroOption.value}
                                className="size-10 text-violet-700 dark:text-violet-300"
                            />
                        ) : (
                            <SparklesIcon className="size-10 text-violet-600 dark:text-violet-400" />
                        )}
                    </span>
                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <Text className="text-base font-semibold text-zinc-950 dark:text-white">
                                {heroOption?.label ?? t('integrations.ai')}
                            </Text>
                            <Badge color={configured ? 'green' : 'zinc'}>
                                {configured ? t('integrations.configured') : t('integrations.not_configured')}
                            </Badge>
                        </div>
                        {configured && displayModel ? (
                            <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                                {displayModel}
                            </Text>
                        ) : null}
                    </div>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleSave();
                    }}
                >
                    <Fieldset>
                        <Legend className="sr-only">{t('integrations.ai_settings')}</Legend>
                        <FieldGroup>
                            <Field>
                                <Label>{t('integrations.ai_provider')}</Label>
                                <div className="mt-3">
                                    <AiProviderDropdown
                                        value={provider}
                                        onChange={(value) => {
                                            setProvider(value);
                                            setFieldErrors((current) => ({ ...current, provider: undefined }));
                                        }}
                                        disabled={busy}
                                        invalid={Boolean(fieldErrors.provider)}
                                        emptyLabel={t('integrations.select_provider', 'Select a provider')}
                                    />
                                </div>
                                {fieldErrors.provider ? <ErrorMessage>{fieldErrors.provider}</ErrorMessage> : null}
                            </Field>

                            <Field>
                                <Label>{t('integrations.api_key')}</Label>
                                <Description>
                                    Create a key at{' '}
                                    {selectedOption ? (
                                        <a
                                            href={selectedOption.consoleUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={externalLinkClass}
                                        >
                                            {selectedOption.consoleLabel}
                                        </a>
                                    ) : (
                                        'your provider console'
                                    )}
                                    . The key is stored encrypted and never sent to the browser after save.
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
                                <Label>{t('integrations.model_optional')}</Label>
                                <Description>
                                    {selectedOption
                                        ? t(
                                              'integrations.model_default_help',
                                              { model: selectedOption.defaultModel },
                                              'Leave blank to use the fast default (:model). Flagship or “reasoning” models are slower and can time out.'
                                          )
                                        : t(
                                              'integrations.model_default_help_generic',
                                              'Leave blank to use the fast provider default.'
                                          )}
                                </Description>
                                <Input
                                    type="text"
                                    name="ai_model"
                                    autoComplete="off"
                                    value={model}
                                    placeholder={
                                        selectedOption?.defaultModel ??
                                        t('integrations.provider_default', 'Provider default')
                                    }
                                    onChange={(event) => {
                                        setModel(event.target.value);
                                        setFieldErrors((current) => ({ ...current, model: undefined }));
                                    }}
                                />
                                {fieldErrors.model ? <ErrorMessage>{fieldErrors.model}</ErrorMessage> : null}
                            </Field>
                        </FieldGroup>
                    </Fieldset>
                </form>

                {selectedOption ? (
                    <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                        {t('integrations.ai_usage_help', 'View usage and billing in the provider console:')}{' '}
                        <a
                            href={selectedOption.usageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={externalLinkClass}
                        >
                            {selectedOption.usageLabel}
                        </a>
                    </Text>
                ) : null}
            </div>
        </SideDrawer>
    );
}
