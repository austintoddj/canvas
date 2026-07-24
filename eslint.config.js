import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'public/**',
            'vendor/**',
            'node_modules/**',
            'coverage/**',
            'build/**',
            'resources/dist/**',
            'test-results/**',
        ],
    },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['resources/js/**/*.{ts,tsx}'],
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            'jsx-a11y': jsxA11y,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            // ESLint 10 peer range is not yet declared by jsx-a11y; rules still apply.
            ...Object.fromEntries(
                Object.entries(jsxA11y.flatConfigs.recommended.rules ?? {}).map(([rule, config]) => {
                    if (config === 'error' || config === 2) {
                        return [rule, 'warn'];
                    }

                    if (Array.isArray(config) && (config[0] === 'error' || config[0] === 2)) {
                        return [rule, ['warn', ...config.slice(1)]];
                    }

                    return [rule, config];
                })
            ),
        },
    }
);
