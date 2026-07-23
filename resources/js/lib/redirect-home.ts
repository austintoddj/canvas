import type { NavigateFunction } from 'react-router-dom';

import { toast } from '@/lib/toast';

export function redirectHomeWithError(navigate: NavigateFunction, message: string): void {
    toast.error(message);
    navigate('/', { replace: true });
}
