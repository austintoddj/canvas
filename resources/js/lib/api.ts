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
        case 422:
            throw new ValidationError(body);
        default:
            throw new ApiError(status, body);
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
