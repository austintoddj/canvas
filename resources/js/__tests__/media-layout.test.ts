import { describe, expect, it } from 'vitest';

import emptyStateSource from '@/components/EmptyState.tsx?raw';
import mediaEmptyVisualSource from '@/components/media/MediaEmptyVisual.tsx?raw';
import mediaGridSource from '@/components/media/MediaGrid.tsx?raw';
import mediaIndexSource from '@/pages/Media/Index.tsx?raw';

describe('media library page chrome (shipped source)', () => {
    it('uses PageHeader with title only — no descriptive subtitle under Media', () => {
        expect(mediaIndexSource).toContain('PageHeader');
        expect(mediaIndexSource).toContain('title="Media"');
        expect(mediaIndexSource).not.toContain('Browse and manage images');
        expect(mediaIndexSource).not.toContain('Drop files anywhere to upload');
    });

    it('wires instant search without a dedicated Search submit button', () => {
        expect(mediaIndexSource).toContain('MEDIA_SEARCH_DEBOUNCE_MS');
        expect(mediaIndexSource).toContain('nextCommittedMediaSearch');
        expect(mediaIndexSource).not.toContain('MagnifyingGlassIcon');
        expect(mediaIndexSource).not.toMatch(/>\s*Search\s*</);
        expect(mediaIndexSource).not.toContain('applySearch');
    });

    it('exposes a sort control wired through list filters', () => {
        expect(mediaIndexSource).toContain('media-sort');
        expect(mediaIndexSource).toContain('MEDIA_SORT_OPTIONS');
        expect(mediaIndexSource).toContain('filters.sort');
    });

    it('renders a designed unfiltered empty state and a distinct filtered empty', () => {
        expect(mediaIndexSource).toContain('EmptyState');
        expect(mediaIndexSource).toContain('MEDIA_EMPTY_STATE');
        expect(mediaIndexSource).toContain('MediaEmptyVisual');
        expect(mediaIndexSource).toContain('MEDIA_FILTERED_EMPTY_MESSAGE');
        expect(emptyStateSource).toContain('data-empty-state');
        expect(mediaEmptyVisualSource).toContain('data-media-empty-visual');
    });

    it('swaps header Upload for selection actions without a layout-shifting selection bar', () => {
        expect(mediaIndexSource).toContain('data-media-selection-actions');
        expect(mediaIndexSource).toContain('{selectionCount} selected');
        expect(mediaIndexSource).toContain('Clear');
        expect(mediaIndexSource).not.toContain('Delete selected');
        expect(mediaIndexSource).not.toMatch(/images selected/);
    });

    it('defaults library grid tiles to image-first (captions off)', () => {
        expect(mediaGridSource).toContain('showCaptions = false');
        expect(mediaGridSource).toContain('data-media-tile-caption');
        expect(mediaGridSource).toContain('aria-label={label}');
        // Index does not opt into captions for the library grid.
        expect(mediaIndexSource).not.toContain('showCaptions');
    });

    it('refills page 1 after deletes empty the loaded list while later pages remain', () => {
        expect(mediaIndexSource).toContain('shouldRefillMediaListAfterDelete');
        expect(mediaIndexSource).toContain('refillFirstPage');
        expect(mediaIndexSource).toContain('applyRemovedMedia');
    });
});
