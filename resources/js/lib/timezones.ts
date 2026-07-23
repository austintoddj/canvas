export type TimezoneOption = {
    value: string;
    label: string;
};

export const ESSENTIAL_TIMEZONES = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
    { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Central European (CET/CEST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Tokyo', label: 'Japan (JST)' },
] as const satisfies readonly TimezoneOption[];

const ESSENTIAL_VALUES = new Set<string>(ESSENTIAL_TIMEZONES.map((zone) => zone.value));

export function listTimezoneOptions(): TimezoneOption[] {
    return ESSENTIAL_TIMEZONES.map((zone) => ({ ...zone }));
}

export function listTimezones(): string[] {
    return ESSENTIAL_TIMEZONES.map((zone) => zone.value);
}

export function timezoneLabel(value: string): string {
    return ESSENTIAL_TIMEZONES.find((zone) => zone.value === value)?.label ?? value;
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
