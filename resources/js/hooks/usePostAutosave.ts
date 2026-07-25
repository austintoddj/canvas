import { useCallback, useEffect, useRef, useState } from 'react';

import { ValidationError, type LaravelValidationErrors } from '@/lib/api';
import { postsApi } from '@/lib/api/posts';
import { type PostFormState, serializeFormState, toStorePayload } from '@/lib/posts/form';
import type { Post } from '@/types/api';

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

/** Minimum time the nav shows “Saving…” so fast local responses still register. */
export const SAVE_STATUS_MIN_SAVING_MS = 350;

/** How long “Saved” stays visible before returning to idle. */
export const SAVE_STATUS_SAVED_MS = 2500;

/**
 * Whether performSave can skip the network request.
 * Promote must always store: pending may already match the form baseline.
 */
export function shouldSkipStore(snapshot: string, lastSaved: string | null, promote: boolean): boolean {
    return !promote && snapshot === lastSaved;
}

type UsePostAutosaveOptions = {
    postId: string | null;
    form: PostFormState;
    enabled: boolean;
    debounceMs?: number;
    onSaved?: (post: Post) => void;
};

export function usePostAutosave({ postId, form, enabled, debounceMs = 2500, onSaved }: UsePostAutosaveOptions) {
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [fieldErrors, setFieldErrors] = useState<LaravelValidationErrors>({});
    const [isDirty, setIsDirty] = useState(false);

    const lastSavedSnapshot = useRef<string | null>(null);
    const formRef = useRef(form);
    const onSavedRef = useRef(onSaved);
    const enabledRef = useRef(enabled);
    const postIdRef = useRef(postId);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inFlightPromise = useRef<Promise<boolean> | null>(null);
    const mountedRef = useRef(true);
    const performSaveRef = useRef<() => Promise<boolean>>(async () => false);
    const savingStartedAt = useRef<number | null>(null);
    const promoteNextSave = useRef(false);
    const scheduleNextSave = useRef(false);
    const publishNowNextSave = useRef(false);

    useEffect(() => {
        formRef.current = form;
    }, [form]);

    useEffect(() => {
        onSavedRef.current = onSaved;
    }, [onSaved]);

    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);

    useEffect(() => {
        postIdRef.current = postId;
    }, [postId]);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;

            if (debounceTimer.current !== null) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }
        };
    }, []);

    const markSaved = useCallback((snapshot: string) => {
        lastSavedSnapshot.current = snapshot;
        setIsDirty(false);
        setSaveStatus('saved');
        setFieldErrors({});
    }, []);

    /**
     * Rebase the clean snapshot without changing status (e.g. API published_at
     * echo after a successful save). Keeps “Saved” visible.
     */
    const syncBaseline = useCallback((snapshot: string) => {
        lastSavedSnapshot.current = snapshot;
        setIsDirty(false);
        setFieldErrors({});
    }, []);

    const resetBaseline = useCallback((snapshot: string) => {
        lastSavedSnapshot.current = snapshot;
        setIsDirty(false);
        setSaveStatus('idle');
        setFieldErrors({});
    }, []);

    useEffect(() => {
        performSaveRef.current = async () => {
            while (inFlightPromise.current !== null) {
                await inFlightPromise.current;
            }

            const id = postIdRef.current;

            if (id === null || !enabledRef.current) {
                return false;
            }

            const formSnapshot = formRef.current;
            const snapshot = serializeFormState(formSnapshot);
            const shouldPromote = promoteNextSave.current;
            const shouldSchedule = scheduleNextSave.current;
            const shouldPublishNow = publishNowNextSave.current;
            promoteNextSave.current = false;
            scheduleNextSave.current = false;
            publishNowNextSave.current = false;

            if (shouldSkipStore(snapshot, lastSavedSnapshot.current, shouldPromote)) {
                if (mountedRef.current) {
                    setIsDirty(false);
                    // Preserve an in-progress “Saved” window; do not force idle over it.
                    setSaveStatus((status) => {
                        if (status === 'saving' || status === 'saved') {
                            return status;
                        }

                        return 'idle';
                    });
                }

                return true;
            }

            let resolveInFlight: (ok: boolean) => void = () => {};
            const gate = new Promise<boolean>((resolve) => {
                resolveInFlight = resolve;
            });
            inFlightPromise.current = gate;

            if (mountedRef.current) {
                savingStartedAt.current = Date.now();
                setSaveStatus('saving');
            }

            try {
                const post = await postsApi.store(
                    id,
                    toStorePayload(formSnapshot, {
                        promote: shouldPromote,
                        schedule: shouldSchedule,
                        publish_now: shouldPublishNow,
                    })
                );

                if (!mountedRef.current) {
                    lastSavedSnapshot.current = snapshot;
                    resolveInFlight(true);
                    inFlightPromise.current = null;

                    return true;
                }

                const started = savingStartedAt.current;
                if (started !== null) {
                    const elapsed = Date.now() - started;
                    const remaining = SAVE_STATUS_MIN_SAVING_MS - elapsed;

                    if (remaining > 0) {
                        await new Promise((resolve) => window.setTimeout(resolve, remaining));
                    }

                    savingStartedAt.current = null;
                }

                if (!mountedRef.current) {
                    lastSavedSnapshot.current = snapshot;
                    resolveInFlight(true);
                    inFlightPromise.current = null;

                    return true;
                }

                const currentSnapshot = serializeFormState(formRef.current);

                if (currentSnapshot === snapshot) {
                    markSaved(snapshot);
                } else {
                    lastSavedSnapshot.current = snapshot;
                    setIsDirty(true);
                    setSaveStatus('pending');
                    setFieldErrors({});
                }

                onSavedRef.current?.(post);
                resolveInFlight(true);
                inFlightPromise.current = null;

                if (serializeFormState(formRef.current) !== lastSavedSnapshot.current) {
                    return performSaveRef.current();
                }

                return true;
            } catch (error) {
                savingStartedAt.current = null;

                if (mountedRef.current) {
                    if (error instanceof ValidationError) {
                        setFieldErrors(error.errors);
                    }

                    setSaveStatus('error');
                }

                resolveInFlight(false);
                inFlightPromise.current = null;

                return false;
            }
        };
    }, [markSaved]);

    const saveNow = useCallback(
        async (
            nextForm?: PostFormState,
            options?: { promote?: boolean; schedule?: boolean; publish_now?: boolean }
        ): Promise<boolean> => {
            if (debounceTimer.current !== null) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }

            if (nextForm !== undefined) {
                formRef.current = nextForm;
            }

            promoteNextSave.current = options?.promote === true;
            scheduleNextSave.current = options?.schedule === true;
            publishNowNextSave.current = options?.publish_now === true;

            return performSaveRef.current();
        },
        []
    );

    useEffect(() => {
        if (!enabled || postId === null || lastSavedSnapshot.current === null) {
            return;
        }

        const snapshot = serializeFormState(form);

        if (snapshot === lastSavedSnapshot.current) {
            if (debounceTimer.current !== null) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }

            setIsDirty(false);
            setSaveStatus((status) => {
                if (status === 'saving' || status === 'error' || status === 'saved') {
                    return status;
                }

                return 'idle';
            });

            return;
        }

        setIsDirty(true);
        setSaveStatus((status) => (status === 'saving' ? status : 'pending'));

        if (debounceTimer.current !== null) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            debounceTimer.current = null;
            void performSaveRef.current();
        }, debounceMs);

        return () => {
            if (debounceTimer.current !== null) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }
        };
    }, [debounceMs, enabled, form, postId]);

    useEffect(() => {
        if (saveStatus !== 'saved') {
            return;
        }

        const timer = window.setTimeout(() => {
            if (!mountedRef.current) {
                return;
            }

            setSaveStatus((status) => (status === 'saved' ? 'idle' : status));
        }, SAVE_STATUS_SAVED_MS);

        return () => window.clearTimeout(timer);
    }, [saveStatus]);

    return {
        saveStatus,
        fieldErrors,
        isDirty,
        saveNow,
        resetBaseline,
        markSaved,
        syncBaseline,
    };
}
