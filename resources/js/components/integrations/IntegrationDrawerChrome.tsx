import type { ReactNode } from 'react';

import { IntegrationAboutSection, IntegrationSection } from '@/components/integrations/IntegrationPageLayout';
import { useCanvas } from '@/hooks/useCanvas';

type IntegrationDrawerChromeProps = {
    /** Primary connection form fields. */
    children: ReactNode;
    /** Save / cancel (and webhook test) — lives with the settings card. */
    actions?: ReactNode;
    /** Callouts: API key scope for Unsplash/AI. Omit to hide the about section. */
    permissions?: string[];
    /** Override about section heading (default: Permissions). */
    permissionsTitle?: string;
    /** Override about section help (default: How this key is used.). */
    permissionsHelp?: string;
    /**
     * Important but non-destructive actions (e.g. rotate signing secret).
     * Rendered after operational panels, before about.
     */
    cautionZone?: ReactNode;
    cautionZoneTitle?: string;
    /** Optional mid-page content (e.g. webhook delivery history) after settings. */
    afterSettings?: ReactNode;
    dangerZone?: ReactNode;
    /** Settings card title override. */
    settingsTitle?: string;
    /** Settings card description override. */
    settingsDescription?: string;
    /** Expand about/permissions by default (setup flows). */
    aboutDefaultOpen?: boolean;
};

/**
 * Body sections for an integration detail page (hero is on IntegrationPageLayout).
 *
 * Order matches a focused control-plane layout:
 * 1. Configuration (primary task + actions)
 * 2. Operational history (deliveries) when present
 * 3. Caution / advanced (secret rotate)
 * 4. About / scope (collapsed reference) when permissions are provided
 * 5. Danger zone (last)
 */
export function IntegrationDrawerChrome({
    children,
    actions,
    permissions,
    permissionsTitle,
    permissionsHelp,
    cautionZone,
    cautionZoneTitle,
    afterSettings,
    dangerZone,
    settingsTitle,
    settingsDescription,
    aboutDefaultOpen = false,
}: IntegrationDrawerChromeProps) {
    const { t } = useCanvas();
    const showAbout = permissions !== undefined && permissions.length > 0;
    const detailsTitle = permissionsTitle ?? t('integrations.permissions', 'Permissions');
    const detailsHelp = permissionsHelp ?? t('integrations.permissions_help', 'How this key is used.');

    return (
        <>
            <IntegrationSection
                title={settingsTitle ?? t('integrations.settings', 'Settings')}
                description={
                    settingsDescription ??
                    t('integrations.settings_help', 'Connection details used when Canvas talks to this service.')
                }
                footer={actions}
                data-section="settings"
            >
                <div className="min-w-0" data-integration-settings="true">
                    {children}
                </div>
            </IntegrationSection>

            {afterSettings}

            {cautionZone ? (
                <IntegrationSection title={cautionZoneTitle} variant="caution" data-section="caution">
                    <div data-integration-caution-zone="true">{cautionZone}</div>
                </IntegrationSection>
            ) : null}

            {showAbout ? (
                <IntegrationAboutSection
                    title={detailsTitle}
                    description={detailsHelp}
                    items={permissions}
                    defaultOpen={aboutDefaultOpen}
                />
            ) : null}

            {dangerZone ? (
                <IntegrationSection
                    title={t('integrations.danger_zone', 'Danger zone')}
                    variant="danger"
                    data-section="danger"
                >
                    <div data-integration-danger-zone="true">{dangerZone}</div>
                </IntegrationSection>
            ) : null}
        </>
    );
}
