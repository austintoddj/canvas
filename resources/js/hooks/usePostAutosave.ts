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
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveInFlight = useRef(false);
    const pendingSave = useRef(false);
    const saveNowRef = useRef<() => Promise<void>>(async () => {});

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
        let cancelled = false;

        const clearDebounce = () => {
            if (debounceTimer.current !== null) {
                clearTimeout(debounceTimer.current);
                debounceTimer.current = null;
            }
        };

        const performSave = async () => {
            if (postId === null || !enabled || cancelled) {
                return;
            }

            if (saveInFlight.current) {
                pendingSave.current = true;
                return;
            }

            const payload = toStorePayload(form);
            const snapshot = serializeFormState(form);

            saveInFlight.current = true;
            setSaveStatus('saving');

            try {
                const post = await postsApi.store(postId, payload);

                if (!cancelled) {
                    markSaved(snapshot);
                    onSaved?.(post);
                }
            } catch (error) {
                if (!cancelled) {
                    if (error instanceof ValidationError) {
                        setFieldErrors(error.errors);
                    }

                    setSaveStatus('error');
                }
            } finally {
                saveInFlight.current = false;

                if (pendingSave.current && !cancelled) {
                    pendingSave.current = false;
                    void performSave();
                }
            }
        };

        saveNowRef.current = async () => {
            clearDebounce();
            await performSave();
        };

        if (!enabled || postId === null || lastSavedSnapshot.current === null) {
            return () => {
                cancelled = true;
                clearDebounce();
            };
        }

        const snapshot = serializeFormState(form);

        if (snapshot === lastSavedSnapshot.current) {
            clearDebounce();
            setIsDirty(false);
            setSaveStatus((status) => (status === 'saving' ? status : 'saved'));

            return () => {
                cancelled = true;
            };
        }

        setIsDirty(true);
        setSaveStatus('pending');
        clearDebounce();
        debounceTimer.current = setTimeout(() => {
            debounceTimer.current = null;
            void performSave();
        }, debounceMs);

        return () => {
            cancelled = true;
            clearDebounce();
        };
    }, [debounceMs, enabled, form, markSaved, onSaved, postId]);

    const saveNow = useCallback(async () => {
        await saveNowRef.current();
    }, []);

    return {
        saveStatus,
        fieldErrors,
        isDirty,
        saveNow,
        resetBaseline,
        markSaved,
    };
}
