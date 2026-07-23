import { describe, expect, it, vi } from 'vitest';

import { redirectHomeWithError } from '@/lib/redirect-home';
import { toast } from '@/lib/toast';

vi.mock('@/lib/toast', () => ({
    toast: {
        error: vi.fn(),
    },
}));

describe('redirectHomeWithError', () => {
    it('shows an error toast and navigates home', () => {
        const navigate = vi.fn();

        redirectHomeWithError(navigate, 'Post not found.');

        expect(toast.error).toHaveBeenCalledWith('Post not found.');
        expect(navigate).toHaveBeenCalledWith('/', { replace: true });
    });
});
