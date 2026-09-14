import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import type { CanvasBoot } from '@/types/boot';

import { makeBoot, withCanvas } from './boot';

export type RenderWithCanvasOptions = {
    boot?: CanvasBoot;
    path?: string;
} & Omit<RenderOptions, 'wrapper'>;

export function canvasTree(ui: ReactNode, options: { boot?: CanvasBoot; path?: string } = {}): ReactElement {
    const { boot = makeBoot(), path = '/' } = options;

    return withCanvas(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>, boot);
}

export function renderWithCanvas(ui: ReactNode, options: RenderWithCanvasOptions = {}): RenderResult {
    const { boot, path, ...renderOptions } = options;

    return render(canvasTree(ui, { boot, path }), renderOptions);
}
