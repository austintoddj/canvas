import { useEffect, useState } from 'react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { AiProviderDropdown } from '@/components/integrations/AiProviderDropdown';
import { IntegrationIcon } from '@/components/integrations/IntegrationIcon';
import { Input } from '@/components/input';
import { SideDrawer } from '@/components/SideDrawer';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { ValidationError } from '@/lib/api';
import {
    integrationsApi,
    type AiProviderValue,
    type IntegrationsStatus,
} from '@/lib/api/integrations';
import { aiProviderOption } from '@/lib/integrations/ai-providers';
import { toast } from '@/lib/toast';

type AiIntegrationDrawerProps = {
    open: boolean;
    configured: boolean;
    provider: AiProviderValue | null;
    model: string | null;
    availableInEditor: boolean;
    onClose: () => void;
    onStatusChange: (status: IntegrationsStatus) => void;
};

export function AiIntegrationDrawer({
    open,
    configured,
    provider: initialProvider,
    model: initialModel,
    availableInEditor,
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
    const busy = saving || clearing;

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
        (apiKey.trim() === '' &&
            configured &&
            provider === initialProvider &&
            model.trim() === (initialModel ?? ''));

    return (
        <SideDrawer
            open={open}
            onClose={onClose}
            closeLabel={t('common.close')}
            title={
                <span className="flex items-center gap-3">
                    <IntegrationIcon kind="ai" size="md" />
                    <span className="min-w-0">{t('integrations.ai')}</span>
                </span>
            }
            description={t(
                'integrations.ai_help',
                'Bring your own API key for Grok, ChatGPT, or Claude rewrite tools in the post editor.'
            )}
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
                            disabled={busy}
                            className="text-red-600 dark:text-red-400"
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
            <div className="space-y-6 px-5 py-5">
                <div className="flex items-center gap-2">
                    <Badge color={configured ? 'green' : 'zinc'}>
                        {configured ? t('integrations.configured') : t('integrations.not_configured')}
                    </Badge>
                    {configured && selectedOption ? (
                        <Text className="text-sm text-canvas-muted dark:text-canvas-muted-dark">
                            {selectedOption.label}
                            {initialModel ? ` · ${initialModel}` : ''}
                        </Text>
                    ) : null}
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
                                {fieldErrors.provider ? (
                                    <ErrorMessage>{fieldErrors.provider}</ErrorMessage>
                                ) : null}
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
                                            className="text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400"
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
                                {fieldErrors.api_key ? (
                                    <ErrorMessage>{fieldErrors.api_key}</ErrorMessage>
                                ) : null}
                            </Field>

                            <Field>
                                <Label>{t('integrations.model_optional')}</Label>
                                <Description>
                                    {selectedOption
                                        ? t(
                                              'integrations.model_default_help',
                                              { model: selectedOption.defaultModel },
                                              'Leave blank to use the default (:model).'
                                          )
                                        : t(
                                              'integrations.model_default_help_generic',
                                              'Leave blank to use the default.'
                                          )}
                                </Description>
                                <Input
                                    type="text"
                                    name="ai_model"
                                    autoComplete="off"
                                    value={model}
                                    placeholder={selectedOption?.defaultModel ?? t('integrations.provider_default', 'Provider default')}
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

                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                    {availableInEditor
                        ? t(
                              'integrations.ai_available_in_editor',
                              'AI rewrite tools are available on the post editor toolbar. Reload after connecting if they do not appear yet.'
                          )
                        : t(
                              'integrations.ai_reload_after_connect',
                              'After connecting, reload Canvas so the post editor can show AI tools.'
                          )}
                </Text>
            </div>
        </SideDrawer>
    );
}
