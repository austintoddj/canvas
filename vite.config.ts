import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    publicDir: false,
    plugins: [react(), tailwindcss()],
    build: {
        outDir: 'public/build',
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: {
                app: 'resources/js/app.tsx',
            },
        },
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
