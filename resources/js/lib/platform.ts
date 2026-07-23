/** True when the primary modifier key is Command (macOS, iOS with keyboard). */
export function isApplePlatform(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }

    const platform = navigator.platform ?? '';
    const userAgent = navigator.userAgent ?? '';

    return /Mac|iPhone|iPod|iPad/i.test(platform) || /Mac|iPhone|iPod|iPad/i.test(userAgent);
}

/** Labels for the global search shortcut shown in desktop UI. */
export function searchShortcutKeys(): string[] {
    return isApplePlatform() ? ['⌘', 'K'] : ['Ctrl', 'K'];
}
