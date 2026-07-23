import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const packageDist = 'resources/dist';

function copyStaticAssets(): Plugin {
    const fromDir = 'resources/images';
    const files = [
        'favicon.svg',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'favicon-dark-16x16.png',
        'favicon-dark-32x32.png',
        'apple-touch-icon.png',
    ];

    const copy = () => {
        mkdirSync(packageDist, { recursive: true });

        for (const file of files) {
            copyFileSync(join(fromDir, file), join(packageDist, file));
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
            // Hosts publish this tree to public/vendor/canvas; keep that name so
            // production base URLs (/vendor/canvas/...) match the published path.
            buildDirectory: 'vendor/canvas',
            hotFile: `${packageDist}/canvas.hot`,
            refresh: ['resources/views/**/*.blade.php', 'resources/js/**'],
        }),
        react(),
        tailwindcss(),
        copyStaticAssets(),
    ],
    build: {
        outDir: packageDist,
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
