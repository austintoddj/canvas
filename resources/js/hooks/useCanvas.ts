import { useContext } from 'react';

import { CanvasContext, type CanvasContextValue } from '@/contexts/CanvasContext';

export function useCanvas(): CanvasContextValue {
    const context = useContext(CanvasContext);

    if (context === null) {
        throw new Error('useCanvas must be used within a CanvasProvider');
    }

    return context;
}
