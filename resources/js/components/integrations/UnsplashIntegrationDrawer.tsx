import { useEffect, useState } from 'react';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Description, ErrorMessage, Field, FieldGroup, Fieldset, Label, Legend } from '@/components/fieldset';
import { IntegrationIcon } from '@/components/integrations/IntegrationIcon';
import { Input } from '@/components/input';
import { SideDrawer } from '@/components/SideDrawer';
import { Text } from '@/components/text';
import { useCanvas } from '@/hooks/useCanvas';
import { ValidationError } from '@/lib/api';
import { integrationsApi, type IntegrationsStatus } from '@/lib/api/integrations';
import { toast } from '@/lib/toast';

type UnsplashIntegrationDrawerProps = {
    open: boolean;
    configured: boolean;
    availableInEditor: boolean;
    onClose: () => void;
    onStatusChange: (status: IntegrationsStatus) => void;
};

export function UnsplashIntegrationDrawer({
    open,
    configured,
    availableInEditor,
    onClose,
    onStatusChange,
}: UnsplashIntegrationDrawerProps) {
    const { t } = useCanvas();
    const [accessKey, setAccessKey] = useState('');
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [fieldError, setFieldError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;

        queueMicrotask(() => {
            if (cancelled) {
                return;
            }

            setAccessKey('');
            setFieldError(null);
            setSaving(false);
            setClearing(false);
        });

        return () => {
            cancelled = true;
        };
    }, [open]);

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
            onStatusChange(next);
            setAccessKey('');
            toast.success(t('integrations.unsplash_connected'));
            onClose();
        } catch (error) {
            if (error instanceof ValidationError) {
                const message =
                    error.errors['unsplash.access_key']?.[0] ?? t('common.please_fix_fields');
                setFieldError(message);
                toast.error(t('common.please_fix_fields'));
            } else {
                toast.error(t('integrations.unsplash_save_error'));
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
            onStatusChange(next);
            setAccessKey('');
            toast.success(t('integrations.unsplash_disconnected'));
            onClose();
        } catch {
            toast.error(t('integrations.unsplash_disconnect_error'));
        } finally {
            setClearing(false);
        }
    }

    const busy = saving || clearing;

    return (
        <SideDrawer
            open={open}
            onClose={onClose}
            closeLabel={t('common.close')}
            title={
                <span className="flex items-center gap-3">
                    <IntegrationIcon kind="unsplash" size="md" />
                    <span className="min-w-0">{t('integrations.unsplash')}</span>
                </span>
            }
            description={t('integrations.unsplash_help')}
            footer={
                <>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            color="dark/zinc"
                            disabled={busy || accessKey.trim() === ''}
                            onClick={() => void handleSave()}
                        >
                            {saving
                                ? t('common.saving')
                                : configured
                                  ? t('integrations.save_key', 'Save key')
                                  : t('integrations.connect_unsplash', 'Connect Unsplash')}
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
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleSave();
                    }}
                >
                    <Fieldset>
                        <Legend className="sr-only">{t('integrations.unsplash_key')}</Legend>
                        <FieldGroup>
                            <Field>
                                <Label>{t('integrations.access_key')}</Label>
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
                                    placeholder={
                                        configured
                                            ? t(
                                                  'integrations.placeholder_access_key_replace',
                                                  'Paste a new key to replace the current one'
                                              )
                                            : t(
                                                  'integrations.placeholder_access_key',
                                                  'Paste your Unsplash access key'
                                              )
                                    }
                                    onChange={(event) => {
                                        setAccessKey(event.target.value);
                                        setFieldError(null);
                                    }}
                                />
                                {fieldError ? <ErrorMessage>{fieldError}</ErrorMessage> : null}
                            </Field>
                        </FieldGroup>
                    </Fieldset>
                </form>

                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                    {availableInEditor
                        ? t(
                              'integrations.available_in_editor',
                              'Available in the post editor. Reload after connecting if tools do not appear yet.'
                          )
                        : t(
                              'integrations.reload_after_connect',
                              'After connecting, reload Canvas so the editor can show the Unsplash tab.'
                          )}
                </Text>
            </div>
        </SideDrawer>
    );
}
