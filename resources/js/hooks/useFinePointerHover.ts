import { useEffect, useState } from 'react';

/** True when the device has a fine pointer that supports hover (typical desktop). */
export function useFinePointerHover(): boolean {
    const [fineHover, setFineHover] = useState(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return true;
        }

        return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    });

    useEffect(() => {
        if (typeof window.matchMedia !== 'function') {
            return;
        }

        const media = window.matchMedia('(hover: hover) and (pointer: fine)');
        const sync = () => setFineHover(media.matches);

        sync();
        media.addEventListener('change', sync);

        return () => media.removeEventListener('change', sync);
    }, []);

    return fineHover;
}
