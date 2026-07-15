import { t } from '@/lib/i18n';
import type { Media } from '@/types/api';

export type MediaUploadSuccess = {
    status: 'success';
    file: File;
    media: Media;
};

export type MediaUploadFailure = {
    status: 'error';
    file: File;
    message: string;
};

export type MediaUploadResult = MediaUploadSuccess | MediaUploadFailure;

export type MediaUploadSummary = {
    succeeded: Media[];
    failed: { name: string; message: string }[];
    message: string;
    tone: 'success' | 'warning' | 'error';
};

export type MediaUploadFn = (file: File) => Promise<Media>;

/**
 * Upload each file sequentially, capturing per-file success or failure so a
 * single bad file does not discard the rest of the batch.
 */
export async function uploadMediaFiles(files: File[], upload: MediaUploadFn): Promise<MediaUploadResult[]> {
    const results: MediaUploadResult[] = [];

    for (const file of files) {
        try {
            const media = await upload(file);
            results.push({ status: 'success', file, media });
        } catch (error) {
            results.push({
                status: 'error',
                file,
                message: error instanceof Error ? error.message : t('media.upload_failed'),
            });
        }
    }

    return results;
}

export function summarizeMediaUploads(results: MediaUploadResult[]): MediaUploadSummary | null {
    if (results.length === 0) {
        return null;
    }

    const succeeded = results
        .filter((result): result is MediaUploadSuccess => result.status === 'success')
        .map((result) => result.media);

    const failed = results
        .filter((result): result is MediaUploadFailure => result.status === 'error')
        .map((result) => ({
            name: result.file.name || 'file',
            message: result.message,
        }));

    if (failed.length === 0) {
        const count = succeeded.length;

        return {
            succeeded,
            failed,
            message: count === 1 ? t('media.uploaded_count', { count }) : t('media.uploaded_count_other', { count }),
            tone: 'success',
        };
    }

    const failureDetail = failed
        .slice(0, 3)
        .map((item) => `${item.name}: ${item.message}`)
        .join('; ');
    const extra = failed.length > 3 ? ` (+${failed.length - 3} more)` : '';
    const detail = `${failureDetail}${extra}`;

    if (succeeded.length === 0) {
        return {
            succeeded,
            failed,
            message: t('media.upload_failed_detail', { detail }),
            tone: 'error',
        };
    }

    return {
        succeeded,
        failed,
        message: t('media.upload_partial', {
            succeeded: succeeded.length,
            failed: failed.length,
            detail,
        }),
        tone: 'warning',
    };
}

export function prependMediaItems(existing: Media[], incoming: Media[]): Media[] {
    if (incoming.length === 0) {
        return existing;
    }

    const incomingIds = new Set(incoming.map((item) => item.id));

    return [...incoming, ...existing.filter((item) => !incomingIds.has(item.id))];
}

export function appendMediaItems(existing: Media[], incoming: Media[]): Media[] {
    if (incoming.length === 0) {
        return existing;
    }

    const seen = new Set(existing.map((item) => item.id));

    return [...existing, ...incoming.filter((item) => !seen.has(item.id))];
}

/**
 * After a successful upload, only soft-adjust list filters: switch "All authors"
 * to "Mine" so the new files sit in the expected personal library view. Search
 * and mime filters are left alone so the user's context is not wiped.
 */
export function filtersAfterUpload<TScope extends 'user' | 'all', TMime extends string>(filters: {
    scope: TScope;
    search: string;
    mime: TMime;
}): { scope: 'user'; search: string; mime: TMime } {
    return {
        scope: 'user',
        search: filters.search,
        mime: filters.mime,
    };
}

export type MediaDestroyFn = (id: string) => Promise<void>;

export type MediaDestroyResult = { status: 'success'; id: string } | { status: 'error'; id: string; message: string };

export type MediaDestroySummary = {
    succeeded: string[];
    failed: { id: string; message: string }[];
    message: string;
    tone: 'success' | 'warning' | 'error';
};

/**
 * Delete each media id sequentially so a single failure does not abort the rest.
 */
export async function destroyMediaItems(ids: string[], destroy: MediaDestroyFn): Promise<MediaDestroyResult[]> {
    const results: MediaDestroyResult[] = [];

    for (const id of ids) {
        try {
            await destroy(id);
            results.push({ status: 'success', id });
        } catch (error) {
            results.push({
                status: 'error',
                id,
                message: error instanceof Error ? error.message : t('media.delete_error'),
            });
        }
    }

    return results;
}

export function summarizeMediaDestroys(results: MediaDestroyResult[]): MediaDestroySummary | null {
    if (results.length === 0) {
        return null;
    }

    const succeeded = results.filter((result) => result.status === 'success').map((result) => result.id);
    const failed = results
        .filter((result): result is Extract<MediaDestroyResult, { status: 'error' }> => result.status === 'error')
        .map((result) => ({ id: result.id, message: result.message }));

    if (failed.length === 0) {
        const count = succeeded.length;

        return {
            succeeded,
            failed,
            message: count === 1 ? t('media.deleted_count', { count }) : t('media.deleted_count_other', { count }),
            tone: 'success',
        };
    }

    if (succeeded.length === 0) {
        return {
            succeeded,
            failed,
            message:
                failed.length === 1
                    ? t('media.delete_failed')
                    : t('media.delete_failed_other', { count: failed.length }),
            tone: 'error',
        };
    }

    return {
        succeeded,
        failed,
        message: t('media.delete_partial', {
            succeeded: succeeded.length,
            failed: failed.length,
        }),
        tone: 'warning',
    };
}

export function removeMediaItems(existing: Media[], ids: Iterable<string>): Media[] {
    const remove = new Set(ids);

    if (remove.size === 0) {
        return existing;
    }

    return existing.filter((item) => !remove.has(item.id));
}

/**
 * After deleting every currently loaded item, the library can still have later
 * pages (load-more). Refetch page 1 instead of treating the list as empty.
 */
export function shouldRefillMediaListAfterDelete(remainingItemCount: number, lastPage: number): boolean {
    return remainingItemCount === 0 && lastPage > 1;
}

export function toggleSelectedId(selected: ReadonlySet<string>, id: string): Set<string> {
    const next = new Set(selected);

    if (next.has(id)) {
        next.delete(id);
    } else {
        next.add(id);
    }

    return next;
}
