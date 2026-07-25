import { t } from '@/lib/i18n';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type LaravelValidationErrors = Record<string, string[]>;

export type ApiRequestOptions = {
    method?: HttpMethod;
    body?: unknown;
    signal?: AbortSignal;
};

export class ApiError extends Error {
    readonly status: number;
    readonly body: unknown;

    constructor(status: number, body: unknown, message?: string) {
        super(message ?? `Request failed with status ${status}`);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

export function apiErrorCode(error: unknown): string | null {
    if (!(error instanceof ApiError)) {
        return null;
    }

    if (typeof error.body !== 'object' || error.body === null || !('code' in error.body)) {
        return null;
    }

    const code = (error.body as { code: unknown }).code;

    return typeof code === 'string' && code.trim() !== '' ? code : null;
}

/** Prefer JSON `message` / field errors over a bare HTTP status string. */
export function messageFromApiBody(body: unknown): string | null {
    if (typeof body === 'string' && body.trim() !== '') {
        return body.trim();
    }

    if (typeof body !== 'object' || body === null) {
        return null;
    }

    if ('message' in body) {
        const message = (body as { message: unknown }).message;

        if (typeof message === 'string' && message.trim() !== '') {
            return message.trim();
        }
    }

    const errors = extractValidationErrors(body);
    const firstField = Object.values(errors)[0];
    const firstMessage = firstField?.[0];

    return typeof firstMessage === 'string' && firstMessage.trim() !== '' ? firstMessage.trim() : null;
}

export function apiErrorMessage(error: unknown, fallback?: string): string {
    const resolvedFallback = fallback ?? t('common.request_failed', 'Request failed.');

    if (error instanceof ApiError) {
        const fromBody = messageFromApiBody(error.body);

        if (fromBody) {
            return fromBody;
        }

        if (error.message && !/^Request failed with status \d+$/.test(error.message)) {
            return error.message;
        }

        return resolvedFallback;
    }

    if (error instanceof Error && error.message.trim() !== '') {
        return error.message;
    }

    return resolvedFallback;
}

export class UnauthorizedError extends ApiError {
    constructor(body: unknown) {
        super(401, body, 'Unauthorized');
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends ApiError {
    constructor(body: unknown) {
        super(403, body, 'Forbidden');
        this.name = 'ForbiddenError';
    }
}

export class ValidationError extends ApiError {
    readonly errors: LaravelValidationErrors;

    constructor(body: unknown) {
        const errors = extractValidationErrors(body);
        super(422, body, 'Validation failed');
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

export function apiBaseUrl(): string {
    const path = window.Canvas?.path ?? '/canvas';

    return `${path.replace(/\/$/, '')}/api`;
}

export function csrfToken(): string | null {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? null;
}

function joinUrl(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;

    return `${apiBaseUrl()}${normalized}`;
}

function isFormData(body: unknown): body is FormData {
    return typeof FormData !== 'undefined' && body instanceof FormData;
}

async function parseResponseBody(response: Response): Promise<unknown> {
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        return response.json();
    }

    const text = await response.text();

    return text.length > 0 ? text : null;
}

function extractValidationErrors(body: unknown): LaravelValidationErrors {
    if (typeof body !== 'object' || body === null || !('errors' in body)) {
        return {};
    }

    const { errors } = body as { errors?: unknown };

    if (typeof errors !== 'object' || errors === null) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages.map(String) : [String(messages)],
        ])
    );
}

export function throwForStatus(status: number, body: unknown): never {
    switch (status) {
        case 401:
            throw new UnauthorizedError(body);
        case 403:
            throw new ForbiddenError(body);
        case 413: {
            // Prefer server message; SPA upload path rewrites with t() for locale.
            const message =
                messageFromApiBody(body) ?? t('media.too_large_generic', 'File is too large. Try a smaller image.');
            throw new ApiError(413, body, message);
        }
        case 422:
            throw new ValidationError(body);
        default: {
            const message = messageFromApiBody(body) ?? undefined;
            throw new ApiError(status, body, message);
        }
    }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { method = 'GET', body, signal } = options;
    const headers = new Headers({
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    });

    if (body !== undefined && !isFormData(body)) {
        headers.set('Content-Type', 'application/json');
    }

    const token = csrfToken();

    if (token && method !== 'GET') {
        headers.set('X-CSRF-TOKEN', token);
    }

    const response = await fetch(joinUrl(path), {
        method,
        credentials: 'same-origin',
        headers,
        body: body === undefined ? undefined : isFormData(body) ? body : JSON.stringify(body),
        signal,
    });

    const responseBody = await parseResponseBody(response);

    if (!response.ok) {
        throwForStatus(response.status, responseBody);
    }

    return responseBody as T;
}

export const api = {
    get: <T>(path: string, signal?: AbortSignal) => apiRequest<T>(path, { signal }),

    post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
        apiRequest<T>(path, { method: 'POST', body, signal }),

    put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
        apiRequest<T>(path, { method: 'PUT', body, signal }),

    delete: <T>(path: string, signal?: AbortSignal) => apiRequest<T>(path, { method: 'DELETE', signal }),

    postForm: <T>(path: string, formData: FormData, signal?: AbortSignal) =>
        apiRequest<T>(path, { method: 'POST', body: formData, signal }),
};
