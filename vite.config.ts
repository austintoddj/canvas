import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function copyStaticAssets(): Plugin {
    const fromDir = 'resources/images';
    const toDir = 'public/vendor/canvas';
    const files = [
        'favicon.svg',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'favicon-dark-16x16.png',
        'favicon-dark-32x32.png',
        'apple-touch-icon.png',
    ];

    const copy = () => {
        mkdirSync(toDir, { recursive: true });

        for (const file of files) {
            copyFileSync(join(fromDir, file), join(toDir, file));
        }
    };

    return {
        name: 'canvas-copy-static-assets',
        buildStart() {
            copy();
        },
        closeBundle() {
            copy();
        },
    };
}

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
        copyStaticAssets(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
