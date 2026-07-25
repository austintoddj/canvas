import { t } from '@/lib/i18n';

export type TimezoneOption = {
    value: string;
    label: string;
};

type EssentialTimezone = {
    value: string;
    labelKey: string;
    labelFallback: string;
};

export const ESSENTIAL_TIMEZONES = [
    { value: 'UTC', labelKey: 'timezone.utc', labelFallback: 'UTC (Coordinated Universal Time)' },
    {
        value: 'America/New_York',
        labelKey: 'timezone.america_new_york',
        labelFallback: 'Eastern Time (EST/EDT)',
    },
    {
        value: 'America/Chicago',
        labelKey: 'timezone.america_chicago',
        labelFallback: 'Central Time (CST/CDT)',
    },
    {
        value: 'America/Los_Angeles',
        labelKey: 'timezone.america_los_angeles',
        labelFallback: 'Pacific Time (PST/PDT)',
    },
    { value: 'Europe/London', labelKey: 'timezone.europe_london', labelFallback: 'London (GMT/BST)' },
    {
        value: 'Europe/Paris',
        labelKey: 'timezone.europe_paris',
        labelFallback: 'Central European (CET/CEST)',
    },
    { value: 'Asia/Kolkata', labelKey: 'timezone.asia_kolkata', labelFallback: 'India (IST)' },
    { value: 'Asia/Tokyo', labelKey: 'timezone.asia_tokyo', labelFallback: 'Japan (JST)' },
] as const satisfies readonly EssentialTimezone[];

const ESSENTIAL_VALUES = new Set<string>(ESSENTIAL_TIMEZONES.map((zone) => zone.value));

export function listTimezoneOptions(): TimezoneOption[] {
    return ESSENTIAL_TIMEZONES.map((zone) => ({
        value: zone.value,
        label: t(zone.labelKey, zone.labelFallback),
    }));
}

export function listTimezones(): string[] {
    return ESSENTIAL_TIMEZONES.map((zone) => zone.value);
}

export function timezoneLabel(value: string): string {
    const match = ESSENTIAL_TIMEZONES.find((zone) => zone.value === value);

    if (match === undefined) {
        return value;
    }

    return t(match.labelKey, match.labelFallback);
}

export function isEssentialTimezone(value: string): boolean {
    return ESSENTIAL_VALUES.has(value);
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
    const browser = detectBrowserTimezone();

    if (browser !== null && isEssentialTimezone(browser)) {
        return browser;
    }

    if (typeof appTimezone === 'string' && appTimezone !== '' && isEssentialTimezone(appTimezone)) {
        return appTimezone;
    }

    return 'UTC';
}
