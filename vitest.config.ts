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
        include: ['resources/js/__tests__/**/*.test.ts'],
    },
});
