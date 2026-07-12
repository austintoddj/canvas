import { useEffect, useState } from 'react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { FormPanelSkeleton } from '@/components/FormPanelSkeleton';
import { Input } from '@/components/input';
import { PageHeader } from '@/components/PageHeader';
import { Text, PageDescription, ErrorText } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { ValidationError } from '@/lib/api';
import { integrationsApi, type IntegrationsStatus } from '@/lib/api/integrations';
import { toast } from '@/lib/toast';

export default function SettingsIntegrations() {
    const { boot } = useCanvas();
    const [status, setStatus] = useState<IntegrationsStatus | null>(null);
    const [accessKey, setAccessKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            setLoading(true);
            setLoadError(null);

            try {
                const next = await integrationsApi.show(controller.signal);
                setStatus(next);
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
            setStatus(next);
            setAccessKey('');
            setEditing(false);
            toast.success('Unsplash connected.');
        } catch (error) {
            if (error instanceof ValidationError) {
                const message = error.errors['unsplash.access_key']?.[0] ?? 'Please check the access key.';
                setFieldError(message);
                toast.error('Please fix the highlighted fields.');
            } else {
                toast.error('Unable to save Unsplash settings.');
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
        setFieldError(null);

        try {
            const next = await integrationsApi.update({
                unsplash: { access_key: null },
            });
            setStatus(next);
            setAccessKey('');
            setEditing(false);
            toast.success('Unsplash disconnected.');
        } catch {
            toast.error('Unable to disconnect Unsplash.');
        } finally {
            setClearing(false);
        }
    }

    function startEditing() {
        setAccessKey('');
        setFieldError(null);
        setEditing(true);
    }

    function cancelEditing() {
        setAccessKey('');
        setFieldError(null);
        setEditing(false);
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-2xl space-y-8" aria-busy="true">
                <PageHeader title="Integrations">
                    <PageDescription>Connect third-party services to Canvas.</PageDescription>
                </PageHeader>
                <FormPanelSkeleton fields={3} />
            </div>
        );
    }

    const configured = status?.unsplash.configured === true;
    const showKeyForm = !configured || editing;

    return (
        <div className="mx-auto max-w-2xl space-y-8">
            <PageHeader title="Integrations">
                <PageDescription>Connect third-party services to Canvas.</PageDescription>
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
                    <Badge color={configured ? 'green' : 'zinc'}>{configured ? 'Configured' : 'Not configured'}</Badge>
                </div>

                {showKeyForm ? (
                    <form
                        className="mt-6"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleSave();
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
                                        value={accessKey}
                                        placeholder="Paste your Unsplash access key"
                                        onChange={(event) => {
                                            setAccessKey(event.target.value);
                                            setFieldError(null);
                                        }}
                                    />
                                    {fieldError ? <ErrorMessage>{fieldError}</ErrorMessage> : null}
                                </Field>
                            </FieldGroup>
                        </Fieldset>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <Button type="submit" color="dark/zinc" disabled={saving || accessKey.trim() === ''}>
                                {saving ? 'Saving…' : configured ? 'Save key' : 'Connect Unsplash'}
                            </Button>
                            {editing ? (
                                <Button type="button" outline disabled={saving} onClick={cancelEditing}>
                                    Cancel
                                </Button>
                            ) : null}
                        </div>
                    </form>
                ) : (
                    <div className="mt-6 flex flex-wrap gap-2">
                        <Button type="button" outline disabled={clearing} onClick={startEditing}>
                            Update
                        </Button>
                        <Button type="button" outline disabled={clearing || saving} onClick={() => void handleClear()}>
                            {clearing ? 'Disconnecting…' : 'Disconnect'}
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
        </div>
    );
}
