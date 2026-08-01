import { stripHtml } from '@/lib/posts/text-diff';
import type { PostRevisionListItem, RevisionReason } from '@/types/api';

export type RevisionFilter = 'all' | 'named';

/**
 * Scannable history blocks:
 * Today → Yesterday → remaining weekdays this week → Last week → month names.
 */
export type RevisionPeriodGroup = {
    /** Stable sort/identity key (not necessarily a calendar day). */
    periodKey: string;
    /** Display label for the block header */
    periodLabel: string;
    /** Sort rank: lower = newer block (shown first). */
    sortRank: number;
    revisions: PostRevisionListItem[];
};

export type PeriodLabelOptions = {
    today?: string;
    yesterday?: string;
    lastWeek?: string;
    locale?: string;
};

/** @deprecated Use RevisionPeriodGroup */
export type RevisionDayGroup = {
    dayKey: string;
    dayLabel: string;
    revisions: PostRevisionListItem[];
};

export type DayLabelOptions = PeriodLabelOptions;

/**
 * Group revisions into scannable relative periods (newest block first).
 * Within a block, revisions stay newest-first (API order preserved per group).
 */
export function groupRevisionsByPeriod(
    revisions: PostRevisionListItem[],
    now: Date = new Date(),
    labels: PeriodLabelOptions = {}
): RevisionPeriodGroup[] {
    const groups = new Map<string, RevisionPeriodGroup>();

    for (const revision of revisions) {
        const date = new Date(revision.created_at);

        if (Number.isNaN(date.getTime())) {
            continue;
        }

        const bucket = periodBucketFor(date, now, labels);
        const existing = groups.get(bucket.periodKey);

        if (existing) {
            existing.revisions.push(revision);
        } else {
            groups.set(bucket.periodKey, {
                periodKey: bucket.periodKey,
                periodLabel: bucket.periodLabel,
                sortRank: bucket.sortRank,
                revisions: [revision],
            });
        }
    }

    return [...groups.values()].sort((a, b) => {
        if (a.sortRank !== b.sortRank) {
            return a.sortRank - b.sortRank;
        }

        // Same rank family (e.g. weekdays): newer period key first when keys are day dates.
        return a.periodKey < b.periodKey ? 1 : a.periodKey > b.periodKey ? -1 : 0;
    });
}

/**
 * @deprecated Prefer groupRevisionsByPeriod for history UI.
 * Still groups by local calendar day for any callers that need day keys.
 */
export function groupRevisionsByDay(
    revisions: PostRevisionListItem[],
    now: Date = new Date(),
    labels: DayLabelOptions = {}
): RevisionDayGroup[] {
    return groupRevisionsByPeriod(revisions, now, labels).map((group) => ({
        dayKey: group.periodKey,
        dayLabel: group.periodLabel,
        revisions: group.revisions,
    }));
}

type PeriodBucket = {
    periodKey: string;
    periodLabel: string;
    sortRank: number;
};

/**
 * Week starts Monday (ISO-style) for “this week” / “last week” boundaries.
 */
export function startOfWeekMonday(date: Date): Date {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = start.getDay(); // 0 Sun … 6 Sat
    const offset = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - offset);
    start.setHours(0, 0, 0, 0);

    return start;
}

export function localDayKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(later: Date, earlier: Date): number {
    const ms = startOfLocalDay(later).getTime() - startOfLocalDay(earlier).getTime();

    return Math.round(ms / 86_400_000);
}

function periodBucketFor(date: Date, now: Date, labels: PeriodLabelOptions): PeriodBucket {
    const locale = labels.locale;
    const today = startOfLocalDay(now);
    const target = startOfLocalDay(date);
    const dayDelta = daysBetween(today, target);

    if (dayDelta === 0) {
        return {
            periodKey: 'today',
            periodLabel: labels.today ?? 'Today',
            sortRank: 0,
        };
    }

    if (dayDelta === 1) {
        return {
            periodKey: 'yesterday',
            periodLabel: labels.yesterday ?? 'Yesterday',
            sortRank: 1,
        };
    }

    const thisWeekStart = startOfWeekMonday(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    if (target >= thisWeekStart && target < today) {
        // Remaining days earlier in the current week (not today/yesterday).
        const dayKey = localDayKey(target);

        return {
            periodKey: `weekday-${dayKey}`,
            periodLabel: target.toLocaleDateString(locale, { weekday: 'long' }),
            // 2 + distance from week start so Mon < Tue < … and reverse sort by key still works with rank.
            sortRank: 2 + daysBetween(today, target),
        };
    }

    if (target >= lastWeekStart && target <= lastWeekEnd) {
        return {
            periodKey: 'last-week',
            periodLabel: labels.lastWeek ?? 'Last week',
            sortRank: 100,
        };
    }

    // Month blocks (and year when not current year).
    const year = target.getFullYear();
    const month = target.getMonth();
    const periodKey = `month-${year}-${String(month + 1).padStart(2, '0')}`;
    const sameYear = year === now.getFullYear();
    const periodLabel = target.toLocaleDateString(locale, {
        month: 'long',
        ...(sameYear ? {} : { year: 'numeric' }),
    });

    // Older months further down: rank grows as we go back in time.
    const monthIndex = year * 12 + month;
    const nowMonthIndex = now.getFullYear() * 12 + now.getMonth();
    const monthsAgo = nowMonthIndex - monthIndex;

    return {
        periodKey,
        periodLabel,
        sortRank: 200 + monthsAgo,
    };
}

/** Format a revision timestamp for list rows (e.g. "9:52 AM"). */
export function formatRevisionTime(value: string, locale?: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: '2-digit',
    });
}

/**
 * List-row timestamp: month, day, and time (e.g. "Jul 30, 2:15 PM").
 * Includes year when the revision is not in the current calendar year.
 */
export function formatRevisionDateTime(value: string, locale?: string, now: Date = new Date()): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    const sameYear = date.getFullYear() === now.getFullYear();

    return date.toLocaleString(locale, {
        month: 'short',
        day: 'numeric',
        ...(sameYear ? {} : { year: 'numeric' }),
        hour: 'numeric',
        minute: '2-digit',
    });
}

/** Prefer user label, fall back to date/time. */
export function revisionListPrimaryLabel(
    revision: PostRevisionListItem,
    locale?: string,
    now: Date = new Date()
): string {
    if (isNamedRevision(revision)) {
        return revision.label!.trim();
    }

    return formatRevisionDateTime(revision.created_at, locale, now);
}

/** Prefer user label, fall back to time of day. */
export function revisionDisplayName(revision: PostRevisionListItem, locale?: string): string {
    if (isNamedRevision(revision)) {
        return revision.label!.trim();
    }

    return formatRevisionTime(revision.created_at, locale);
}

/** Named when the user set a non-empty label (rename or labeled save). */
export function isNamedRevision(revision: PostRevisionListItem): boolean {
    return revision.label !== null && revision.label.trim() !== '';
}

export function filterRevisions(revisions: PostRevisionListItem[], filter: RevisionFilter): PostRevisionListItem[] {
    if (filter === 'named') {
        return revisions.filter(isNamedRevision);
    }

    return revisions;
}

/**
 * Newest checkpoint in the list (tip of history).
 * Not “current document” — the editor is always current; this is only the latest snapshot.
 */
export function latestRevisionId(revisions: PostRevisionListItem[]): string | null {
    return revisions[0]?.id ?? null;
}

/** @deprecated Prefer latestRevisionId — “current” is the editor, not a revision row. */
export function currentRevisionId(revisions: PostRevisionListItem[]): string | null {
    return latestRevisionId(revisions);
}

/** True when a revision snapshot matches the editor (restore would be a no-op). */
export function revisionMatchesEditor(
    revision: { title: string | null; body: string | null },
    editorTitle: string,
    editorBody: string | null
): boolean {
    const beforeTitle = revision.title ?? '';
    const afterTitle = editorTitle;
    const beforeBody = stripHtml(revision.body);
    const afterBody = stripHtml(editorBody);

    return beforeTitle === afterTitle && beforeBody === afterBody;
}

export function revisionAuthorName(revision: PostRevisionListItem): string | null {
    const name = revision.user?.name?.trim();

    if (name) {
        return name;
    }

    const username = revision.user?.username?.trim();

    return username || null;
}

const REASON_I18N_KEYS: Record<RevisionReason, string> = {
    origin: 'editor.history_reason_origin',
    published: 'editor.history_reason_published',
    scheduled: 'editor.history_reason_scheduled',
    unpublished: 'editor.history_reason_unpublished',
    updated: 'editor.history_reason_updated',
    manual: 'editor.history_reason_manual',
    left: 'editor.history_reason_left',
    restored: 'editor.history_reason_restored',
};

const REASON_FALLBACKS: Record<RevisionReason, string> = {
    origin: 'First version',
    published: 'Published',
    scheduled: 'Scheduled',
    unpublished: 'Unpublished',
    updated: 'Updated',
    manual: 'Saved version',
    left: 'Left editor',
    restored: 'Restored',
};

/**
 * Localized label for a stored revision reason, or null when unknown/legacy.
 */
export function revisionReasonLabel(
    reason: RevisionReason | string | null | undefined,
    translate: (key: string, fallback: string) => string
): string | null {
    if (reason === null || reason === undefined || reason === '') {
        return null;
    }

    if (!(reason in REASON_FALLBACKS)) {
        return null;
    }

    const typed = reason as RevisionReason;

    return translate(REASON_I18N_KEYS[typed], REASON_FALLBACKS[typed]);
}

/**
 * Secondary list line: "Published · Alice" (reason and/or author when present).
 */
export function revisionListSecondaryLine(
    revision: PostRevisionListItem,
    translate: (key: string, fallback: string) => string
): string | null {
    const reason = revisionReasonLabel(revision.reason, translate);
    const author = revisionAuthorName(revision);

    if (reason && author) {
        return `${reason} · ${author}`;
    }

    return reason ?? author;
}
