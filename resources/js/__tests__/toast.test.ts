// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { dismissToast, getToasts, subscribeToasts, toast, toastFromTone } from '@/lib/toast';

describe('toast API', () => {
    beforeEach(() => {
        dismissToast();
        vi.useFakeTimers();
    });

    afterEach(() => {
        dismissToast();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('shows success, error, neutral, and warning variants on the shared store', () => {
        const successId = toast.success('Uploaded.');
        const errorId = toast.error('Failed.');
        const messageId = toast.message('Heads up.');
        const warningId = toast.warning('Partial.');

        const items = getToasts();

        expect(items).toHaveLength(4);
        expect(items.map((item) => item.id)).toEqual([successId, errorId, messageId, warningId]);
        expect(items.map((item) => ({ message: item.message, tone: item.tone }))).toEqual([
            { message: 'Uploaded.', tone: 'success' },
            { message: 'Failed.', tone: 'error' },
            { message: 'Heads up.', tone: 'message' },
            { message: 'Partial.', tone: 'warning' },
        ]);
    });

    it('supports the callable toast entry point with an optional tone', () => {
        toast('Default neutral');
        toast('As error', { tone: 'error' });

        expect(getToasts().map((item) => item.tone)).toEqual(['message', 'error']);
        expect(getToasts().map((item) => item.message)).toEqual(['Default neutral', 'As error']);
    });

    it('maps media-style tones through toastFromTone', () => {
        toastFromTone('ok', 'success');
        toastFromTone('bad', 'error');
        toastFromTone('mixed', 'warning');

        expect(getToasts().map((item) => item.tone)).toEqual(['success', 'error', 'warning']);
    });

    it('dismisses a single toast by id and clears all when no id is given', () => {
        const first = toast.success('One');
        const second = toast.error('Two');

        dismissToast(first);
        expect(getToasts().map((item) => item.id)).toEqual([second]);

        toast.dismiss();
        expect(getToasts()).toEqual([]);
    });

    it('notifies subscribers when the stack changes', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeToasts(listener);

        toast.message('Hello');
        expect(listener).toHaveBeenCalledTimes(1);

        const id = toast.success('Done');
        expect(listener).toHaveBeenCalledTimes(2);

        dismissToast(id);
        expect(listener).toHaveBeenCalledTimes(3);

        unsubscribe();
        toast.error('After unsubscribe');
        expect(listener).toHaveBeenCalledTimes(3);
    });

    it('keeps only the newest toasts when the stack exceeds the limit', () => {
        for (let index = 0; index < 7; index += 1) {
            toast.message(`Item ${index}`);
        }

        const messages = getToasts().map((item) => item.message);

        expect(messages).toHaveLength(5);
        expect(messages).toEqual(['Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6']);
    });

    it('ignores blank messages', () => {
        expect(toast.success('   ')).toBe('');
        expect(getToasts()).toEqual([]);
    });

    it('honors a custom duration on the created toast item', () => {
        const id = toast.success('Quick', { duration: 1500 });
        const item = getToasts().find((toastItem) => toastItem.id === id);

        expect(item?.duration).toBe(1500);
    });
});
