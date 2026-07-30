import { describe, expect, it } from 'vitest';

import {
    filterRevisions,
    formatRevisionDateTime,
    formatRevisionTime,
    groupRevisionsByPeriod,
    isNamedRevision,
    latestRevisionId,
    localDayKey,
    revisionAuthorName,
    revisionDisplayName,
    revisionListPrimaryLabel,
    revisionMatchesEditor,
    startOfWeekMonday,
} from '@/lib/posts/revision-history';
import type { PostRevisionListItem } from '@/types/api';

function revision(
    overrides: Partial<PostRevisionListItem> & Pick<PostRevisionListItem, 'id' | 'created_at'>
): PostRevisionListItem {
    return {
        post_id: 'post-1',
        user_id: null,
        label: null,
        title: 'Title',
        updated_at: overrides.created_at,
        ...overrides,
    };
}

function atLocal(year: number, monthIndex: number, day: number, hour = 12): string {
    return new Date(year, monthIndex, day, hour, 0, 0).toISOString();
}

describe('groupRevisionsByPeriod', () => {
    // Friday, July 31, 2026 — mid-afternoon
    const now = new Date(2026, 6, 31, 15, 0, 0);

    it('buckets today, yesterday, earlier weekdays, last week, and months', () => {
        // This week Mon Jul 27 … Fri Jul 31
        expect(localDayKey(startOfWeekMonday(now))).toBe(localDayKey(new Date(2026, 6, 27)));

        const revisions = [
            revision({ id: 'today', created_at: atLocal(2026, 6, 31, 14) }),
            revision({ id: 'yesterday', created_at: atLocal(2026, 6, 30, 10) }),
            revision({ id: 'wednesday', created_at: atLocal(2026, 6, 29, 9) }),
            revision({ id: 'monday', created_at: atLocal(2026, 6, 27, 11) }),
            revision({ id: 'last-week', created_at: atLocal(2026, 6, 22, 12) }), // Wed prior week
            revision({ id: 'june', created_at: atLocal(2026, 5, 10, 12) }),
            revision({ id: 'may', created_at: atLocal(2026, 4, 5, 12) }),
        ];

        const groups = groupRevisionsByPeriod(revisions, now, {
            today: 'Today',
            yesterday: 'Yesterday',
            lastWeek: 'Last week',
            locale: 'en-US',
        });

        expect(groups.map((group) => group.periodKey)).toEqual([
            'today',
            'yesterday',
            'weekday-2026-07-29',
            'weekday-2026-07-27',
            'last-week',
            'month-2026-06',
            'month-2026-05',
        ]);

        expect(groups.map((group) => group.periodLabel)).toEqual([
            'Today',
            'Yesterday',
            'Wednesday',
            'Monday',
            'Last week',
            'June',
            'May',
        ]);

        expect(groups[0]?.revisions.map((item) => item.id)).toEqual(['today']);
        expect(groups.find((group) => group.periodKey === 'last-week')?.revisions[0]?.id).toBe('last-week');
    });

    it('keeps multiple revisions under the same period newest-first as provided', () => {
        const revisions = [
            revision({ id: 'r1', created_at: atLocal(2026, 6, 31, 15) }),
            revision({ id: 'r2', created_at: atLocal(2026, 6, 31, 9) }),
        ];

        const groups = groupRevisionsByPeriod(revisions, now, { today: 'Today' });

        expect(groups).toHaveLength(1);
        expect(groups[0]?.periodKey).toBe('today');
        expect(groups[0]?.revisions.map((item) => item.id)).toEqual(['r1', 'r2']);
    });

    it('labels older-year months with the year', () => {
        const revisions = [revision({ id: 'old', created_at: atLocal(2025, 0, 15, 12) })];
        const groups = groupRevisionsByPeriod(revisions, now, { locale: 'en-US' });

        expect(groups[0]?.periodKey).toBe('month-2025-01');
        expect(groups[0]?.periodLabel).toMatch(/January/);
        expect(groups[0]?.periodLabel).toMatch(/2025/);
    });
});

describe('revisionListPrimaryLabel', () => {
    it('uses the user name when the revision has a label', () => {
        const item = revision({
            id: 'r1',
            created_at: new Date(2026, 6, 18, 9, 52).toISOString(),
            label: 'Before launch',
        });

        expect(revisionListPrimaryLabel(item)).toBe('Before launch');
        expect(revisionDisplayName(item)).toBe('Before launch');
        expect(isNamedRevision(item)).toBe(true);
    });

    it('falls back to date/time when unlabeled', () => {
        const created = new Date(2026, 6, 18, 9, 52).toISOString();
        const item = revision({ id: 'r1', created_at: created, label: null });
        const now = new Date(2026, 6, 30, 12, 0, 0);

        expect(isNamedRevision(item)).toBe(false);
        expect(revisionListPrimaryLabel(item, 'en-US', now)).toBe(formatRevisionDateTime(created, 'en-US', now));
        expect(revisionDisplayName(item)).toBe(formatRevisionTime(created));
    });
});

describe('formatRevisionDateTime', () => {
    it('includes month, day, and time for the current year', () => {
        const now = new Date(2026, 6, 30, 12, 0, 0);
        const created = new Date(2026, 6, 18, 9, 52).toISOString();
        const label = formatRevisionDateTime(created, 'en-US', now);

        expect(label).toMatch(/Jul/);
        expect(label).toMatch(/18/);
        expect(label).toMatch(/\d{1,2}:\d{2}/);
        expect(label).not.toMatch(/2026/);
    });
});

describe('filterRevisions', () => {
    it('keeps only labeled rows for the named filter', () => {
        const revisions = [
            revision({ id: 'a', created_at: '2026-07-30T10:00:00.000Z', label: 'Launch' }),
            revision({ id: 'b', created_at: '2026-07-30T09:00:00.000Z', label: null }),
            revision({ id: 'c', created_at: '2026-07-30T08:00:00.000Z', label: '  ' }),
        ];

        expect(filterRevisions(revisions, 'all')).toHaveLength(3);
        expect(filterRevisions(revisions, 'named').map((item) => item.id)).toEqual(['a']);
    });
});

describe('latestRevisionId', () => {
    it('uses the first list item as the latest checkpoint', () => {
        const revisions = [
            revision({ id: 'newest', created_at: '2026-07-30T12:00:00.000Z' }),
            revision({ id: 'older', created_at: '2026-07-29T12:00:00.000Z' }),
        ];

        expect(latestRevisionId(revisions)).toBe('newest');
        expect(latestRevisionId([])).toBeNull();
    });
});

describe('revisionMatchesEditor', () => {
    it('compares plain title and stripped body to the editor', () => {
        expect(revisionMatchesEditor({ title: 'Hello', body: '<p>World</p>' }, 'Hello', '<p>World</p>')).toBe(true);

        expect(revisionMatchesEditor({ title: 'Hello', body: '<p>World</p>' }, 'Hello', '<p>Changed</p>')).toBe(false);
    });
});

describe('revisionAuthorName', () => {
    it('prefers name then username', () => {
        expect(
            revisionAuthorName(
                revision({
                    id: 'r1',
                    created_at: '2026-07-30T12:00:00.000Z',
                    user: { id: 1, name: 'Ada', username: 'ada', avatar_url: null },
                })
            )
        ).toBe('Ada');

        expect(revisionAuthorName(revision({ id: 'r3', created_at: '2026-07-30T12:00:00.000Z' }))).toBeNull();
    });
});
