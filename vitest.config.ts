import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(rootDir, 'resources/js'),
        },
    },
    test: {
        environment: 'node',
        include: ['resources/js/__tests__/**/*.{test,spec}.{ts,tsx}'],
        setupFiles: ['resources/js/__tests__/setup.ts', 'resources/js/__tests__/setup-dom.ts'],
        clearMocks: true,
        // Editor embed tests insert real Twitter/Vimeo iframe srcs. happy-dom
        // otherwise fetches those pages (and their scripts) over the network.
        environmentOptions: {
            happyDOM: {
                settings: {
                    navigation: {
                        disableChildFrameNavigation: true,
                    },
                },
            },
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'clover'],
            reportsDirectory: './coverage',
            include: ['resources/js/**/*.{ts,tsx}'],
            exclude: ['resources/js/__tests__/**', 'resources/js/types/**', 'resources/js/types.d.ts'],
            thresholds: {
                'resources/js/lib/**': {
                    lines: 85,
                    statements: 85,
                    functions: 85,
                    branches: 75,
                },
            },
        },
    },
});
