const FALLBACK_TIMEZONES = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'America/Mexico_City',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Moscow',
    'Africa/Cairo',
    'Asia/Dubai',
    'Asia/Riyadh',
    'Asia/Kolkata',
    'Asia/Dhaka',
    'Asia/Bangkok',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Jakarta',
    'Australia/Sydney',
    'Pacific/Auckland',
] as const;

type IntlWithSupportedValues = typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
};

export function listTimezones(): string[] {
    try {
        const supported = (Intl as IntlWithSupportedValues).supportedValuesOf?.('timeZone');

        if (Array.isArray(supported) && supported.length > 0) {
            const zones = [...supported];

            if (!zones.includes('UTC')) {
                zones.unshift('UTC');
            }

            return zones;
        }
    } catch {
        // Fall through to the static list.
    }

    return [...FALLBACK_TIMEZONES];
}

export function detectBrowserTimezone(): string | null {
    try {
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        return typeof zone === 'string' && zone !== '' ? zone : null;
    } catch {
        return null;
    }
}

export function defaultTimezone(appTimezone?: string): string {
    return detectBrowserTimezone() ?? appTimezone ?? 'UTC';
}
