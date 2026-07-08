/** Host application origin (outside the Canvas SPA basename). */
export function hostOrigin(): string {
    return window.location.origin;
}

export function hostHomeUrl(): string {
    return hostOrigin();
}
