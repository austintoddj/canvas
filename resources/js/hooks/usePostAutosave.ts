import { useCallback, useEffect, useRef, useState } from 'react';

import { ValidationError, type LaravelValidationErrors } from '@/lib/api';
import { postsApi } from '@/lib/api/posts';
import { type PostFormState, serializeFormState, toStorePayload } from '@/lib/posts/form';
import type { Post } from '@/types/api';

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

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

            if (snapshot === lastSavedSnapshot.current) {
                if (mountedRef.current) {
                    setIsDirty(false);
                    setSaveStatus((status) => (status === 'saving' ? status : 'idle'));
                }

                return true;
            }

            let resolveInFlight: (ok: boolean) => void = () => {};
            const gate = new Promise<boolean>((resolve) => {
                resolveInFlight = resolve;
            });
            inFlightPromise.current = gate;

            if (mountedRef.current) {
                setSaveStatus('saving');
            }

            try {
                const post = await postsApi.store(id, toStorePayload(formSnapshot));

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

    const saveNow = useCallback(async (nextForm?: PostFormState): Promise<boolean> => {
        if (debounceTimer.current !== null) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
        }

        if (nextForm !== undefined) {
            formRef.current = nextForm;
        }

        return performSaveRef.current();
    }, []);

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
        }, 2500);

        return () => window.clearTimeout(timer);
    }, [saveStatus]);

    return {
        saveStatus,
        fieldErrors,
        isDirty,
        saveNow,
        resetBaseline,
        markSaved,
    };
}
