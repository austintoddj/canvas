import { useCanvas } from '@/hooks/useCanvas';
import type { CanvasPermissions } from '@/lib/canvas-context-value';

export function usePermissions(): CanvasPermissions {
    return useCanvas().permissions;
}
