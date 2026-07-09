export type ToastTone = 'success' | 'error' | 'message' | 'warning';

export type ToastItem = {
    id: string;
    message: string;
    tone: ToastTone;
    duration: number;
    createdAt: number;
};

export type ToastOptions = {
    duration?: number;
};

const DEFAULT_DURATION_MS = 4000;
const MAX_VISIBLE = 5;

let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();
let nextId = 0;

function emit(): void {
    for (const listener of listeners) {
        listener();
    }
}

function createId(): string {
    nextId += 1;
    return `toast-${nextId}`;
}

function push(message: string, tone: ToastTone, duration = DEFAULT_DURATION_MS): string {
    const trimmed = message.trim();

    if (trimmed === '') {
        return '';
    }

    const id = createId();
    const item: ToastItem = {
        id,
        message: trimmed,
        tone,
        duration,
        createdAt: Date.now(),
    };

    toasts = [...toasts, item].slice(-MAX_VISIBLE);
    emit();

    return id;
}

export function getToasts(): readonly ToastItem[] {
    return toasts;
}

export function subscribeToasts(listener: () => void): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

export function dismissToast(id?: string): void {
    if (id === undefined) {
        if (toasts.length === 0) {
            return;
        }

        toasts = [];
        emit();
        return;
    }

    const next = toasts.filter((item) => item.id !== id);

    if (next.length === toasts.length) {
        return;
    }

    toasts = next;
    emit();
}

function showToast(message: string, options?: ToastOptions & { tone?: ToastTone }): string {
    return push(message, options?.tone ?? 'message', options?.duration ?? DEFAULT_DURATION_MS);
}

export const toast = Object.assign(showToast, {
    success(message: string, options?: ToastOptions): string {
        return push(message, 'success', options?.duration ?? DEFAULT_DURATION_MS);
    },
    error(message: string, options?: ToastOptions): string {
        return push(message, 'error', options?.duration ?? DEFAULT_DURATION_MS);
    },
    message(message: string, options?: ToastOptions): string {
        return push(message, 'message', options?.duration ?? DEFAULT_DURATION_MS);
    },
    warning(message: string, options?: ToastOptions): string {
        return push(message, 'warning', options?.duration ?? DEFAULT_DURATION_MS);
    },
    dismiss: dismissToast,
});

export function toastFromTone(message: string, tone: 'success' | 'warning' | 'error', options?: ToastOptions): string {
    if (tone === 'success') {
        return toast.success(message, options);
    }

    if (tone === 'error') {
        return toast.error(message, options);
    }

    return toast.warning(message, options);
}
