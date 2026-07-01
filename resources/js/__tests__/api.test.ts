// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    ApiError,
    ForbiddenError,
    UnauthorizedError,
    ValidationError,
    api,
    apiBaseUrl,
    apiRequest,
    throwForStatus,
} from '@/lib/api';

function jsonResponse(status: number, body: unknown): Response {
    if (status === 204) {
        return new Response(null, { status });
    }

    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('apiBaseUrl', () => {
    it('builds the API path from window.Canvas', () => {
        window.Canvas = {
            ...window.Canvas,
            path: '/canvas',
        };

        expect(apiBaseUrl()).toBe('/canvas/api');
    });

    it('strips a trailing slash from the canvas path', () => {
        window.Canvas = {
            ...window.Canvas,
            path: '/canvas/',
        };

        expect(apiBaseUrl()).toBe('/canvas/api');
    });
});

describe('throwForStatus', () => {
    it('throws typed errors for 401, 403, and 422', () => {
        expect(() => throwForStatus(401, {})).toThrow(UnauthorizedError);
        expect(() => throwForStatus(403, {})).toThrow(ForbiddenError);
        expect(() => throwForStatus(422, { errors: { slug: ['Taken'] } })).toThrow(ValidationError);
    });

    it('parses Laravel validation errors on 422', () => {
        try {
            throwForStatus(422, { message: 'Error', errors: { slug: ['The slug is taken.'] } });
        } catch (error) {
            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).errors).toEqual({ slug: ['The slug is taken.'] });
        }
    });

    it('throws ApiError for other status codes', () => {
        expect(() => throwForStatus(500, { message: 'Server error' })).toThrow(ApiError);
    });
});

describe('apiRequest', () => {
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
        document.head.innerHTML = '<meta name="csrf-token" content="test-csrf-token">';
        window.Canvas = {
            ...window.Canvas,
            path: '/canvas',
        };
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        fetchMock.mockReset();
    });

    it('GETs JSON from the canvas API base URL', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

        const result = await apiRequest<{ ok: boolean }>('/posts');

        expect(fetchMock).toHaveBeenCalledWith(
            '/canvas/api/posts',
            expect.objectContaining({
                method: 'GET',
                credentials: 'same-origin',
            })
        );
        expect(result).toEqual({ ok: true });
    });

    it('does not send CSRF on GET requests', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, {}));

        await apiRequest('/posts');

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const headers = new Headers(init.headers);

        expect(headers.get('X-CSRF-TOKEN')).toBeNull();
    });

    it('sends CSRF and JSON body on POST requests', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(201, { id: 'post-1' }));

        await apiRequest('/posts/post-1', {
            method: 'POST',
            body: { title: 'Hello' },
        });

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const headers = new Headers(init.headers);

        expect(headers.get('X-CSRF-TOKEN')).toBe('test-csrf-token');
        expect(headers.get('Content-Type')).toBe('application/json');
        expect(headers.get('X-Requested-With')).toBe('XMLHttpRequest');
        expect(init.body).toBe(JSON.stringify({ title: 'Hello' }));
    });

    it('posts FormData without setting Content-Type', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(201, { id: 'media-1' }));

        const formData = new FormData();
        formData.append('file', new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' }));

        await apiRequest('/media/media-1', { method: 'POST', body: formData });

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        const headers = new Headers(init.headers);

        expect(headers.get('Content-Type')).toBeNull();
        expect(init.body).toBe(formData);
    });

    it('returns null for 204 responses', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(204, null));

        const result = await apiRequest<null>('/posts/post-1', { method: 'DELETE' });

        expect(result).toBeNull();
    });

    it('throws UnauthorizedError on 401', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthenticated' }));

        await expect(apiRequest('/posts')).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('throws ForbiddenError on 403', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(403, { message: 'Forbidden' }));

        await expect(apiRequest('/tags')).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('throws ValidationError on 422', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(422, { message: 'Error', errors: { title: ['Required'] } }));

        await expect(apiRequest('/posts/id', { method: 'POST', body: {} })).rejects.toMatchObject({
            name: 'ValidationError',
            errors: { title: ['Required'] },
        });
    });
});

describe('api helpers', () => {
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
        document.head.innerHTML = '<meta name="csrf-token" content="token">';
        window.Canvas = { ...window.Canvas, path: '/canvas' };
        vi.stubGlobal('fetch', fetchMock);
        fetchMock.mockImplementation(async () => jsonResponse(200, { success: true }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('exposes get, post, put, delete, and postForm', async () => {
        await api.get('/posts');
        await api.post('/posts/1', { title: 'A' });
        await api.put('/media/1', { alt: 'Alt' });
        await api.delete('/posts/1');

        const formData = new FormData();
        await api.postForm('/media/1', formData);

        expect(fetchMock).toHaveBeenCalledTimes(5);
        expect(fetchMock.mock.calls[0]?.[0]).toBe('/canvas/api/posts');
        expect(fetchMock.mock.calls[1]?.[0]).toBe('/canvas/api/posts/1');
        expect(fetchMock.mock.calls[4]?.[0]).toBe('/canvas/api/media/1');
    });
});
