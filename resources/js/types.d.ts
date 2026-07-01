import type { CanvasBoot } from './types/boot';

declare global {
    interface Window {
        Canvas: CanvasBoot;
    }
}

export {};
