import { describe, expect, it } from 'vitest';

import animatedOutletSource from '@/components/AnimatedOutlet.tsx?raw';
import emptyStateSource from '@/components/EmptyState.tsx?raw';
import fadeInImageSource from '@/components/FadeInImage.tsx?raw';
import mediaEmptyVisualSource from '@/components/media/MediaEmptyVisual.tsx?raw';
import mediaGridSource from '@/components/media/MediaGrid.tsx?raw';
import mediaGridSkeletonSource from '@/components/media/MediaGridSkeleton.tsx?raw';
import pageSource from '@/components/Page.tsx?raw';
import pageFallbackSource from '@/components/PageFallback.tsx?raw';
import layoutSource from '@/layouts/Layout.tsx?raw';
import mediaIndexSource from '@/pages/Media/Index.tsx?raw';

describe('media library page chrome (shipped source)', () => {
    it('uses PageHeader titled Media Library with a short subtitle', () => {
        expect(mediaIndexSource).toContain('PageHeader');
        expect(mediaIndexSource).toContain('title="Media Library"');
        expect(mediaIndexSource).toContain('Upload and organize images for posts');
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
        expect(mediaIndexSource).toContain('EmptyStateReveal');
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
        expect(mediaIndexSource).not.toContain('showCaptions');
    });

    it('refills page 1 after deletes empty the loaded list while later pages remain', () => {
        expect(mediaIndexSource).toContain('shouldRefillMediaListAfterDelete');
        expect(mediaIndexSource).toContain('refillFirstPage');
        expect(mediaIndexSource).toContain('applyRemovedMedia');
    });

    it('uses layout-matched skeleton only for initial load and keeps content while refreshing', () => {
        expect(mediaIndexSource).toContain('isInitialLoading');
        expect(mediaIndexSource).toContain('isRefreshing');
        expect(mediaIndexSource).toContain('MediaGridSkeleton');
        expect(mediaIndexSource).toContain('ContentReveal');
        expect(mediaIndexSource).toContain('busy={refreshing}');
        expect(mediaIndexSource).toContain('useAsyncReveal');
        expect(mediaIndexSource).toContain('animate={animateEmpty}');
        expect(mediaIndexSource).toContain('animate={animateContent}');
        expect(mediaIndexSource).toContain('EmptyStateReveal');
        expect(mediaIndexSource).toContain('data-media-library-body');
        expect(mediaIndexSource).not.toContain('Loading media…');
        expect(mediaGridSkeletonSource).toContain('data-media-grid-skeleton');
        expect(mediaGridSkeletonSource).toContain('MEDIA_GRID_CLASS_NAME');
    });

    it('fades media thumbnails in via FadeInImage instead of raw img pops', () => {
        expect(mediaGridSource).toContain('FadeInImage');
        expect(mediaGridSource).toContain('resolveMediaUrl');
        expect(mediaGridSource).not.toMatch(/<img[\s\S]*src=\{item\.url\}/);
        expect(fadeInImageSource).toContain("loading = 'lazy'");
        expect(fadeInImageSource).toContain("decoding = 'async'");
        expect(fadeInImageSource).toContain('image.complete');
        expect(fadeInImageSource).toContain('opacity-0');
        expect(fadeInImageSource).toContain('opacity-100');
        expect(fadeInImageSource).toContain('onError');
    });

    it('uses a non-null neutral route Suspense fallback (not media-grid shaped)', () => {
        expect(pageSource).toContain('PageFallback');
        expect(pageSource).not.toContain('fallback={null}');
        expect(pageFallbackSource).toContain('data-page-fallback');
        expect(pageFallbackSource).toContain('aria-busy');
        expect(pageFallbackSource).not.toContain('aspect-square');
        expect(pageFallbackSource).not.toContain('grid-cols-2');
        expect(pageFallbackSource).not.toContain('grid-cols-4');
    });

    it('swaps route bodies instantly and soft-reveals content only (no whole-page rise)', () => {
        expect(layoutSource).toContain('AnimatedOutlet');
        expect(layoutSource).not.toMatch(/<Outlet\s*\/>/);
        expect(animatedOutletSource).toContain('data-page-transition');
        expect(animatedOutletSource).not.toContain('AnimatePresence');
        expect(animatedOutletSource).not.toMatch(/[,{]\s*y:\s*/);
        expect(animatedOutletSource).not.toContain('mode="wait"');
        expect(mediaIndexSource).toContain('ContentReveal');
        expect(mediaIndexSource).not.toContain('MIN_INITIAL_SKELETON_MS');
        expect(mediaIndexSource).not.toContain('remainingMinDuration');
        expect(mediaIndexSource).not.toContain('hasSettledOnceRef');
    });
});
