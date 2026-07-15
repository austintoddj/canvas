import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import {
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownTrailingIcon,
    dropdownInsetItemClass,
    selectDropdownTriggerClass,
} from '@/components/dropdown';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { FormPanelSkeleton } from '@/components/FormPanelSkeleton';
import { Input } from '@/components/input';
import { PageHeader } from '@/components/PageHeader';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { ValidationError } from '@/lib/api';
import { integrationsApi, type AiProviderValue, type IntegrationsStatus } from '@/lib/api/integrations';
import { AI_PROVIDER_OPTIONS, aiProviderOption } from '@/lib/integrations/ai-providers';
import { toast } from '@/lib/toast';

export default function SettingsIntegrations() {
    const { boot, t } = useCanvas();
    const [status, setStatus] = useState<IntegrationsStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [unsplashKey, setUnsplashKey] = useState('');
    const [unsplashEditing, setUnsplashEditing] = useState(false);
    const [unsplashSaving, setUnsplashSaving] = useState(false);
    const [unsplashClearing, setUnsplashClearing] = useState(false);
    const [unsplashFieldError, setUnsplashFieldError] = useState<string | null>(null);

    const [aiProvider, setAiProvider] = useState<AiProviderValue | null>(null);
    const [aiKey, setAiKey] = useState('');
    const [aiModel, setAiModel] = useState('');
    const [aiEditing, setAiEditing] = useState(false);
    const [aiSaving, setAiSaving] = useState(false);
    const [aiClearing, setAiClearing] = useState(false);
    const [aiFieldErrors, setAiFieldErrors] = useState<{ provider?: string; api_key?: string; model?: string }>({});

    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            setLoading(true);
            setLoadError(null);

            try {
                const next = await integrationsApi.show(controller.signal);
                setStatus(next);
                setAiProvider(next.ai.provider);
                setAiModel(next.ai.model ?? '');
                setLoading(false);
            } catch {
                if (!controller.signal.aborted) {
                    setLoadError('Unable to load integrations.');
                    setLoading(false);
                }
            }
        }

        void load();

        return () => controller.abort();
    }, []);

    async function handleSaveUnsplash() {
        if (unsplashSaving || unsplashKey.trim() === '') {
            return;
        }

        setUnsplashSaving(true);
        setUnsplashFieldError(null);

        try {
            const next = await integrationsApi.update({
                unsplash: { access_key: unsplashKey.trim() },
            });
            setStatus(next);
            setUnsplashKey('');
            setUnsplashEditing(false);
            toast.success(t('integrations.unsplash_connected'));
        } catch (error) {
            if (error instanceof ValidationError) {
                const message = error.errors['unsplash.access_key']?.[0] ?? 'Please check the access key.';
                setUnsplashFieldError(message);
                toast.error('Please fix the highlighted fields.');
            } else {
                toast.error(t('integrations.unsplash_save_error'));
            }
        } finally {
            setUnsplashSaving(false);
        }
    }

    async function handleClearUnsplash() {
        if (unsplashClearing) {
            return;
        }

        setUnsplashClearing(true);
        setUnsplashFieldError(null);

        try {
            const next = await integrationsApi.update({
                unsplash: { access_key: null },
            });
            setStatus(next);
            setUnsplashKey('');
            setUnsplashEditing(false);
            toast.success(t('integrations.unsplash_disconnected'));
        } catch {
            toast.error(t('integrations.unsplash_disconnect_error'));
        } finally {
            setUnsplashClearing(false);
        }
    }

    async function handleSaveAi() {
        if (aiSaving) {
            return;
        }

        const provider = aiProvider ?? status?.ai.provider ?? null;
        const key = aiKey.trim();
        const model = aiModel.trim();
        const alreadyConfigured = status?.ai.configured === true;

        if (!alreadyConfigured && key === '') {
            setAiFieldErrors({ api_key: 'An API key is required.' });
            return;
        }

        if (key !== '' && provider === null) {
            setAiFieldErrors({ provider: 'Choose a provider.' });
            return;
        }

        if (key === '' && model === (status?.ai.model ?? '') && provider === status?.ai.provider) {
            return;
        }

        setAiSaving(true);
        setAiFieldErrors({});

        try {
            const payload: Parameters<typeof integrationsApi.update>[0] = {
                ai: {
                    provider,
                    model: model === '' ? null : model,
                },
            };

            if (key !== '') {
                payload.ai = { ...payload.ai, api_key: key };
            } else if (!alreadyConfigured) {
                payload.ai = { ...payload.ai, api_key: null };
            }

            const next = await integrationsApi.update(payload);
            setStatus(next);
            setAiKey('');
            setAiProvider(next.ai.provider);
            setAiModel(next.ai.model ?? '');
            setAiEditing(false);
            toast.success(alreadyConfigured ? 'AI settings saved.' : 'AI writing connected.');
        } catch (error) {
            if (error instanceof ValidationError) {
                setAiFieldErrors({
                    provider: error.errors['ai.provider']?.[0],
                    api_key: error.errors['ai.api_key']?.[0],
                    model: error.errors['ai.model']?.[0],
                });
                toast.error('Please fix the highlighted fields.');
            } else {
                toast.error(t('integrations.ai_save_error'));
            }
        } finally {
            setAiSaving(false);
        }
    }

    async function handleClearAi() {
        if (aiClearing) {
            return;
        }

        setAiClearing(true);
        setAiFieldErrors({});

        try {
            const next = await integrationsApi.update({
                ai: { api_key: null },
            });
            setStatus(next);
            setAiKey('');
            setAiProvider(next.ai.provider);
            setAiModel(next.ai.model ?? '');
            setAiEditing(false);
            toast.success(t('integrations.ai_disconnected'));
        } catch {
            toast.error(t('integrations.ai_disconnect_error'));
        } finally {
            setAiClearing(false);
        }
    }

    function startUnsplashEditing() {
        setUnsplashKey('');
        setUnsplashFieldError(null);
        setUnsplashEditing(true);
    }

    function cancelUnsplashEditing() {
        setUnsplashKey('');
        setUnsplashFieldError(null);
        setUnsplashEditing(false);
    }

    function startAiEditing() {
        setAiKey('');
        setAiProvider(status?.ai.provider ?? null);
        setAiModel(status?.ai.model ?? '');
        setAiFieldErrors({});
        setAiEditing(true);
    }

    function cancelAiEditing() {
        setAiKey('');
        setAiProvider(status?.ai.provider ?? null);
        setAiModel(status?.ai.model ?? '');
        setAiFieldErrors({});
        setAiEditing(false);
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-2xl space-y-8" aria-busy="true">
                <PageHeader title={t('integrations.title')}>
                    <PageDescription>{t('integrations.description')}</PageDescription>
                </PageHeader>
                <FormPanelSkeleton fields={3} />
            </div>
        );
    }

    const unsplashConfigured = status?.unsplash.configured === true;
    const showUnsplashForm = !unsplashConfigured || unsplashEditing;
    const aiConfigured = status?.ai.configured === true;
    const showAiForm = !aiConfigured || aiEditing;
    const selectedAiOption = aiProviderOption(aiProvider ?? status?.ai.provider);

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            <PageHeader title={t('integrations.title')}>
                <PageDescription>{t('integrations.description')}</PageDescription>
            </PageHeader>

            {loadError ? <ErrorText>{loadError}</ErrorText> : null}

            <section className="rounded-2xl border border-zinc-950/10 bg-zinc-950/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Text className="text-base font-semibold text-zinc-950 dark:text-white">Unsplash</Text>
                        <Text className="mt-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                            Search and insert free stock photos in the post editor.
                        </Text>
                    </div>
                    <Badge color={unsplashConfigured ? 'green' : 'zinc'}>
                        {unsplashConfigured ? 'Configured' : 'Not configured'}
                    </Badge>
                </div>

                {showUnsplashForm ? (
                    <form
                        className="mt-6"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleSaveUnsplash();
                        }}
                    >
                        <Fieldset>
                            <Legend className="sr-only">Unsplash access key</Legend>
                            <FieldGroup>
                                <Field>
                                    <Label>Access key</Label>
                                    <Description>
                                        Create an app at{' '}
                                        <a
                                            href="https://unsplash.com/oauth/applications"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400"
                                        >
                                            unsplash.com/oauth/applications
                                        </a>
                                        . Demo apps are limited to 50 requests per hour.
                                    </Description>
                                    <Input
                                        type="password"
                                        name="unsplash_access_key"
                                        autoComplete="off"
                                        value={unsplashKey}
                                        placeholder="Paste your Unsplash access key"
                                        onChange={(event) => {
                                            setUnsplashKey(event.target.value);
                                            setUnsplashFieldError(null);
                                        }}
                                    />
                                    {unsplashFieldError ? <ErrorMessage>{unsplashFieldError}</ErrorMessage> : null}
                                </Field>
                            </FieldGroup>
                        </Fieldset>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <Button
                                type="submit"
                                color="dark/zinc"
                                disabled={unsplashSaving || unsplashKey.trim() === ''}
                            >
                                {unsplashSaving ? 'Saving…' : unsplashConfigured ? 'Save key' : 'Connect Unsplash'}
                            </Button>
                            {unsplashEditing ? (
                                <Button type="button" outline disabled={unsplashSaving} onClick={cancelUnsplashEditing}>
                                    Cancel
                                </Button>
                            ) : null}
                        </div>
                    </form>
                ) : (
                    <div className="mt-6 flex flex-wrap gap-2">
                        <Button type="button" outline disabled={unsplashClearing} onClick={startUnsplashEditing}>
                            Update
                        </Button>
                        <Button
                            type="button"
                            outline
                            disabled={unsplashClearing || unsplashSaving}
                            onClick={() => void handleClearUnsplash()}
                        >
                            {unsplashClearing ? 'Disconnecting…' : 'Disconnect'}
                        </Button>
                    </div>
                )}

                {boot.unsplash ? (
                    <Text className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                        Unsplash is available in the post editor for featured and body images. Reload after connecting
                        if tabs do not appear yet.
                    </Text>
                ) : (
                    <Text className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                        After connecting, reload Canvas so the editor can show the Unsplash tab.
                    </Text>
                )}
            </section>

            <section className="rounded-2xl border border-zinc-950/10 bg-zinc-950/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Text className="text-base font-semibold text-zinc-950 dark:text-white">AI writing</Text>
                        <Text className="mt-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                            Bring your own API key for Grok, ChatGPT, or Claude rewrite tools in the post editor.
                        </Text>
                    </div>
                    <Badge color={aiConfigured ? 'green' : 'zinc'}>
                        {aiConfigured ? 'Configured' : 'Not configured'}
                    </Badge>
                </div>

                {showAiForm ? (
                    <form
                        className="mt-6"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleSaveAi();
                        }}
                    >
                        <Fieldset>
                            <Legend className="sr-only">AI provider settings</Legend>
                            <FieldGroup>
                                <Field>
                                    <Label>Provider</Label>
                                    <AiProviderDropdown
                                        value={aiProvider}
                                        onChange={(value) => {
                                            setAiProvider(value);
                                            setAiFieldErrors((current) => ({ ...current, provider: undefined }));
                                        }}
                                        disabled={aiSaving}
                                        invalid={Boolean(aiFieldErrors.provider)}
                                    />
                                    {aiFieldErrors.provider ? (
                                        <ErrorMessage>{aiFieldErrors.provider}</ErrorMessage>
                                    ) : null}
                                </Field>

                                <Field>
                                    <Label>API key</Label>
                                    <Description>
                                        Create a key at{' '}
                                        {selectedAiOption ? (
                                            <a
                                                href={selectedAiOption.consoleUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 dark:text-blue-400"
                                            >
                                                {selectedAiOption.consoleLabel}
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
                                        value={aiKey}
                                        placeholder={
                                            aiConfigured
                                                ? 'Paste a new key to replace the current one'
                                                : 'Paste your API key'
                                        }
                                        onChange={(event) => {
                                            setAiKey(event.target.value);
                                            setAiFieldErrors((current) => ({ ...current, api_key: undefined }));
                                        }}
                                    />
                                    {aiFieldErrors.api_key ? (
                                        <ErrorMessage>{aiFieldErrors.api_key}</ErrorMessage>
                                    ) : null}
                                </Field>

                                <Field>
                                    <Label>Model (optional)</Label>
                                    <Description>
                                        Leave blank to use the default
                                        {selectedAiOption ? ` (${selectedAiOption.defaultModel})` : ''}.
                                    </Description>
                                    <Input
                                        type="text"
                                        name="ai_model"
                                        autoComplete="off"
                                        value={aiModel}
                                        placeholder={selectedAiOption?.defaultModel ?? 'Provider default'}
                                        onChange={(event) => {
                                            setAiModel(event.target.value);
                                            setAiFieldErrors((current) => ({ ...current, model: undefined }));
                                        }}
                                    />
                                    {aiFieldErrors.model ? <ErrorMessage>{aiFieldErrors.model}</ErrorMessage> : null}
                                </Field>
                            </FieldGroup>
                        </Fieldset>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <Button
                                type="submit"
                                color="dark/zinc"
                                disabled={
                                    aiSaving ||
                                    (aiKey.trim() === '' && !aiConfigured) ||
                                    (aiKey.trim() === '' &&
                                        aiConfigured &&
                                        (aiProvider ?? null) === (status?.ai.provider ?? null) &&
                                        aiModel.trim() === (status?.ai.model ?? ''))
                                }
                            >
                                {aiSaving ? 'Saving…' : aiConfigured ? 'Save settings' : 'Connect AI'}
                            </Button>
                            {aiEditing ? (
                                <Button type="button" outline disabled={aiSaving} onClick={cancelAiEditing}>
                                    Cancel
                                </Button>
                            ) : null}
                        </div>
                    </form>
                ) : (
                    <div className="mt-6 space-y-4">
                        <dl className="space-y-1 text-sm text-canvas-muted dark:text-canvas-muted-dark">
                            <div className="flex gap-2">
                                <dt className="font-medium text-zinc-700 dark:text-zinc-300">Provider</dt>
                                <dd>{aiProviderOption(status?.ai.provider)?.label ?? '—'}</dd>
                            </div>
                            {status?.ai.model ? (
                                <div className="flex gap-2">
                                    <dt className="font-medium text-zinc-700 dark:text-zinc-300">Model</dt>
                                    <dd>{status.ai.model}</dd>
                                </div>
                            ) : null}
                        </dl>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" outline disabled={aiClearing} onClick={startAiEditing}>
                                Update
                            </Button>
                            <Button
                                type="button"
                                outline
                                disabled={aiClearing || aiSaving}
                                onClick={() => void handleClearAi()}
                            >
                                {aiClearing ? 'Disconnecting…' : 'Disconnect'}
                            </Button>
                        </div>
                    </div>
                )}

                {boot.ai ? (
                    <Text className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                        AI rewrite tools are available on the post editor toolbar. Reload after connecting if they do
                        not appear yet.
                    </Text>
                ) : (
                    <Text className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                        After connecting, reload Canvas so the post editor can show AI tools.
                    </Text>
                )}
            </section>
        </div>
    );
}

function AiProviderDropdown({
    value,
    onChange,
    disabled = false,
    invalid = false,
}: {
    value: AiProviderValue | null;
    onChange: (value: AiProviderValue) => void;
    disabled?: boolean;
    invalid?: boolean;
}) {
    const selectedLabel = aiProviderOption(value)?.label ?? null;

    return (
        <Dropdown>
            <DropdownButton
                outline
                disabled={disabled}
                data-invalid={invalid ? true : undefined}
                aria-invalid={invalid || undefined}
                className={clsx(
                    selectDropdownTriggerClass,
                    selectedLabel === null && 'text-zinc-500 dark:text-zinc-400',
                    invalid && 'border-red-500 dark:border-red-600'
                )}
            >
                <span className="min-w-0 truncate text-left">{selectedLabel ?? 'Select a provider'}</span>
                <ChevronDownIcon data-slot="icon" className="shrink-0" />
            </DropdownButton>
            <DropdownMenu anchor="bottom start" className="z-50 min-w-56 max-w-sm">
                {AI_PROVIDER_OPTIONS.map((option) => {
                    const selected = value === option.value;

                    return (
                        <DropdownItem
                            key={option.value}
                            disabled={disabled}
                            onClick={() => onChange(option.value)}
                            className={dropdownInsetItemClass}
                        >
                            <DropdownLabel inset>{option.label}</DropdownLabel>
                            {selected ? (
                                <DropdownTrailingIcon inset>
                                    <CheckIcon className="size-4 text-zinc-950 dark:text-white" />
                                </DropdownTrailingIcon>
                            ) : null}
                        </DropdownItem>
                    );
                })}
            </DropdownMenu>
        </Dropdown>
    );
}
