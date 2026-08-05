import { formatRelativeTime } from '@/lib/format-relative-time';
import type { PostAuthor, PostLastRevision } from '@/types/api';

function actorDisplayName(user: PostAuthor | null | undefined): string | null {
    if (user === null || user === undefined) {
        return null;
    }

    const name = user.name?.trim();

    if (name) {
        return name;
    }

    const username = user.username?.trim();

    return username || null;
}

export type LastEditCopyOptions = {
    /** Translate with optional :time / :name replacements. */
    t: (key: string, replacementsOrFallback?: string | Record<string, string | number>, fallback?: string) => string;
    currentUserId: number;
    /** BCP 47 locale(s) for relative time. */
    locale?: string | string[];
    now?: Date;
    /** Plain tooltip when no tip revision / invalid time. */
    fallback: string;
};

/**
 * Docs-style history tooltip: always last edit; “by you” when the tip is yours.
 * Badge / unseen state is intentionally out of scope until a real notification system exists.
 */
export function lastEditTooltip(
    lastRevision: PostLastRevision | null | undefined,
    options: LastEditCopyOptions
): string {
    const { t, currentUserId, locale, now = new Date(), fallback } = options;

    if (lastRevision === null || lastRevision === undefined) {
        return fallback;
    }

    const time = formatRelativeTime(lastRevision.created_at, now, locale);

    if (time === null) {
        return fallback;
    }

    const isSelf = lastRevision.user_id !== null && lastRevision.user_id === currentUserId;

    if (isSelf) {
        return t(
            'editor.history_last_edit_you',
            { time },
            'Last edit was :time by you'
        );
    }

    const name = actorDisplayName(lastRevision.user);

    if (name === null) {
        return t('editor.history_last_edit_unknown', { time }, 'Last edit was :time');
    }

    return t('editor.history_last_edit', { time, name }, 'Last edit was :time by :name');
}
