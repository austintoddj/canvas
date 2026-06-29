import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.tsx'],
            buildDirectory: 'vendor/canvas',
            hotFile: 'public/vendor/canvas/canvas.hot',
            refresh: ['resources/views/**/*.blade.php', 'resources/js/**'],
        }),
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
