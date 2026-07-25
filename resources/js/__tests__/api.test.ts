// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    ApiError,
    ForbiddenError,
    UnauthorizedError,
    ValidationError,
    api,
    apiBaseUrl,
    apiErrorCode,
    apiErrorMessage,
    apiRequest,
    messageFromApiBody,
    throwForStatus,
} from '@/lib/api';
import { loadTranslations } from '@/lib/i18n';

function jsonResponse(status: number, body: unknown): Response {
    if (status === 204) {
        return new Response(null, { status });
    }

    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('api client', () => {
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
        document.head.innerHTML = '<meta name="csrf-token" content="test-csrf-token">';
        window.Canvas = { ...window.Canvas, path: '/canvas' };
        loadTranslations(
            JSON.stringify({
                'common.request_failed': 'Request failed.',
                'media.too_large_generic': 'File is too large. Try a smaller image.',
            })
        );
        vi.stubGlobal('fetch', fetchMock);
        fetchMock.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('builds the API base URL and throws typed status errors', () => {
        expect(apiBaseUrl()).toBe('/canvas/api');
        window.Canvas = { ...window.Canvas, path: '/canvas/' };
        expect(apiBaseUrl()).toBe('/canvas/api');

        expect(() => throwForStatus(401, {})).toThrow(UnauthorizedError);
        expect(() => throwForStatus(403, {})).toThrow(ForbiddenError);
        expect(() => throwForStatus(422, { errors: { slug: ['Taken'] } })).toThrow(ValidationError);
        expect(() => throwForStatus(500, { message: 'Server error' })).toThrow(ApiError);

        try {
            throwForStatus(422, { message: 'Error', errors: { slug: ['The slug is taken.'] } });
        } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).errors).toEqual({ slug: ['The slug is taken.'] });
        }

        try {
            throwForStatus(413, { message: 'File is too large. Maximum size is 1.9 MB.' });
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError);
            expect((error as ApiError).status).toBe(413);
            expect((error as ApiError).message).toBe('File is too large. Maximum size is 1.9 MB.');
        }

        try {
            throwForStatus(413, null);
        } catch (error) {
            expect((error as ApiError).message).toMatch(/too large/i);
            expect((error as ApiError).message).not.toMatch(/status 413/i);
        }

        expect(messageFromApiBody({ message: 'Hello' })).toBe('Hello');
        expect(messageFromApiBody({ errors: { file: ['Too big'] } })).toBe('Too big');
        expect(apiErrorMessage(new ApiError(413, { message: 'File is too large.' }))).toBe('File is too large.');
        expect(apiErrorMessage(new ApiError(500, null))).toBe('Request failed.');

        expect(apiErrorCode(new ApiError(422, { code: 'stats_published_only' }))).toBe('stats_published_only');
        expect(apiErrorCode(new ApiError(404, { message: 'Not found' }))).toBeNull();
        expect(apiErrorCode(new Error('nope'))).toBeNull();
    });

    it('requests JSON with CSRF on writes and maps response errors', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));
        expect(await apiRequest<{ ok: boolean }>('/posts')).toEqual({ ok: true });
        expect(fetchMock).toHaveBeenCalledWith(
            '/canvas/api/posts',
            expect.objectContaining({ method: 'GET', credentials: 'same-origin' })
        );
        const getHeaders = new Headers((fetchMock.mock.calls[0] as [string, RequestInit])[1].headers);
        expect(getHeaders.get('X-CSRF-TOKEN')).toBeNull();

        fetchMock.mockResolvedValueOnce(jsonResponse(201, { id: 'post-1' }));
        await apiRequest('/posts/post-1', { method: 'POST', body: { title: 'Hello' } });
        const postInit = (fetchMock.mock.calls[1] as [string, RequestInit])[1];
        const postHeaders = new Headers(postInit.headers);
        expect(postHeaders.get('X-CSRF-TOKEN')).toBe('test-csrf-token');
        expect(postHeaders.get('Content-Type')).toBe('application/json');
        expect(postInit.body).toBe(JSON.stringify({ title: 'Hello' }));

        fetchMock.mockResolvedValueOnce(jsonResponse(201, { id: 'media-1' }));
        const formData = new FormData();
        formData.append('file', new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' }));
        await apiRequest('/media/media-1', { method: 'POST', body: formData });
        const formHeaders = new Headers((fetchMock.mock.calls[2] as [string, RequestInit])[1].headers);
        expect(formHeaders.get('Content-Type')).toBeNull();

        fetchMock.mockResolvedValueOnce(jsonResponse(204, null));
        expect(await apiRequest<null>('/posts/post-1', { method: 'DELETE' })).toBeNull();

        fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthenticated' }));
        await expect(apiRequest('/posts')).rejects.toBeInstanceOf(UnauthorizedError);
        fetchMock.mockResolvedValueOnce(jsonResponse(403, { message: 'Forbidden' }));
        await expect(apiRequest('/tags')).rejects.toBeInstanceOf(ForbiddenError);
        fetchMock.mockResolvedValueOnce(jsonResponse(422, { message: 'Error', errors: { title: ['Required'] } }));
        await expect(apiRequest('/posts/id', { method: 'POST', body: {} })).rejects.toMatchObject({
            name: 'ValidationError',
            errors: { title: ['Required'] },
        });
    });

    it('exposes get/post/put/delete/postForm helpers', async () => {
        fetchMock.mockImplementation(async () => jsonResponse(200, { success: true }));

        await api.get('/posts');
        await api.post('/posts/1', { title: 'A' });
        await api.put('/media/1', { alt: 'Alt' });
        await api.delete('/posts/1');
        await api.postForm('/media/1', new FormData());

        expect(fetchMock).toHaveBeenCalledTimes(5);
        expect(fetchMock.mock.calls[0]?.[0]).toBe('/canvas/api/posts');
        expect(fetchMock.mock.calls[4]?.[0]).toBe('/canvas/api/media/1');
    });
});
