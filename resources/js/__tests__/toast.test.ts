// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { dismissToast, getToasts, subscribeToasts, toast, toastFromTone } from '@/lib/toast';

describe('toast store', () => {
    beforeEach(() => {
        dismissToast();
        vi.useFakeTimers();
    });

    afterEach(() => {
        dismissToast();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('stores variants, dismisses, caps the stack, and notifies subscribers', () => {
        expect(toast.success('   ')).toBe('');
        expect(getToasts()).toEqual([]);

        const successId = toast.success('Uploaded.');
        toast.error('Failed.');
        toast.message('Heads up.');
        toast.warning('Partial.');
        toast('Default neutral');

        expect(getToasts().map((item) => item.tone)).toEqual(['success', 'error', 'message', 'warning', 'message']);
        toastFromTone('mixed', 'warning');
        const tones = getToasts().map((item) => item.tone);
        expect(tones[tones.length - 1]).toBe('warning');

        dismissToast(successId);
        expect(getToasts().some((item) => item.id === successId)).toBe(false);

        const listener = vi.fn();
        const unsubscribe = subscribeToasts(listener);
        toast.message('Hello');
        expect(listener).toHaveBeenCalledTimes(1);
        unsubscribe();
        toast.error('After unsubscribe');
        expect(listener).toHaveBeenCalledTimes(1);

        toast.dismiss();
        for (let index = 0; index < 7; index += 1) {
            toast.message(`Item ${index}`);
        }
        expect(getToasts().map((item) => item.message)).toEqual(['Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6']);

        const id = toast.success('Quick', { duration: 1500 });
        expect(getToasts().find((item) => item.id === id)?.duration).toBe(1500);
    });
});
