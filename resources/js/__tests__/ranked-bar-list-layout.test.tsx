// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import RankedBarList from '@/components/analytics/RankedBarList';
import { DashboardTopPosts } from '@/components/dashboard/DashboardTopPosts';
import { CanvasContext } from '@/contexts/CanvasContext';
import { makeCanvasValue } from '@/__tests__/helpers/boot';

afterEach(() => {
    cleanup();
});

describe('ranked list overflow constraints', () => {
    it('keeps RankedBarList card within a shrinkable overflow-hidden shell', () => {
        render(
            <RankedBarList
                title="Where readers are coming from"
                entries={[
                    {
                        label: 'https://www.google.com/search?q=very-long-referer-path',
                        value: 2802,
                        displayValue: '2,802',
                        share: 0.32,
                        shareLabel: '32%',
                    },
                    {
                        label: 'Other',
                        value: 1772,
                        displayValue: '1,772',
                        share: 0.2,
                        shareLabel: '20%',
                    },
                ]}
                emptyLabel="No data"
                iconKind="referer"
            />
        );

        const card = document.querySelector('[data-ranked-bar-list="true"]');
        expect(card).not.toBeNull();
        expect(card?.className).toMatch(/min-w-0/);
        expect(card?.className).toMatch(/overflow-hidden/);
        expect(card?.className).toMatch(/max-w-full/);

        const label = screen.getByTitle('https://www.google.com/search?q=very-long-referer-path');
        expect(label.className).toMatch(/truncate/);
        expect(label.className).toMatch(/min-w-0/);
    });

    it('keeps DashboardTopPosts card within a shrinkable overflow-hidden shell', () => {
        const value = makeCanvasValue();

        render(
            <MemoryRouter>
                <CanvasContext.Provider value={value}>
                    <DashboardTopPosts
                        posts={[
                            {
                                id: 'post-1',
                                title: 'Shipping a Calm Writing Surface With A Very Long Title',
                                views: 26677,
                            },
                        ]}
                    />
                </CanvasContext.Provider>
            </MemoryRouter>
        );

        const card = document.querySelector('[data-dashboard-top-posts="true"]');
        expect(card).not.toBeNull();
        expect(card?.className).toMatch(/min-w-0/);
        expect(card?.className).toMatch(/overflow-hidden/);
        expect(card?.className).toMatch(/max-w-full/);
    });
});
