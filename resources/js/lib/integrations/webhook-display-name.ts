const DISPLAY_NAME_MAX = 48;

/**
 * Label for the subscriptions table Name column: URL hostname, or a truncated
 * URL when the host is missing or the value is not an absolute URL.
 */
export function webhookDisplayName(url: string | null | undefined): string {
    const value = url?.trim() ?? '';

    if (value === '') {
        return '';
    }

    try {
        const hostname = new URL(value).hostname.trim();

        if (hostname !== '') {
            return hostname;
        }
    } catch {
        // Not an absolute URL — fall through to a truncated raw value.
    }

    return truncateWebhookDisplayName(value);
}

function truncateWebhookDisplayName(value: string): string {
    if (value.length <= DISPLAY_NAME_MAX) {
        return value;
    }

    return `${value.slice(0, DISPLAY_NAME_MAX - 1)}…`;
}
