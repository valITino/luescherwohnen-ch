// Gemeinsame ESLint-Basis (flat config) für alle Apps und Pakete.
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    name: 'luescher/ignores',
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-pages/**',
      '**/.astro/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'reports/**',
      'shots/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  ...astro.configs['flat/recommended'],
  {
    name: 'luescher/base',
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2023 },
    },
    rules: {
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    name: 'luescher/astro',
    files: ['**/*.astro'],
    rules: {
      // Inline-Styles und Inline-Skripte widersprechen der strikten CSP.
      'astro/no-set-html-directive': 'off',
      'astro/no-unused-css-selector': 'off',
    },
  },
  {
    name: 'luescher/node',
    files: [
      '**/*.config.{js,mjs,ts}',
      // Nur Werkzeug-Skripte: der Browser-Code der Apps liegt unter apps/*/src/scripts.
      'scripts/**/*.{js,mjs,ts}',
      'packages/*/scripts/**/*.{js,mjs,ts}',
      'e2e/**/*.ts',
      'packages/config/**/*.mjs',
    ],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' },
  },
  {
    name: 'luescher/types',
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/triple-slash-reference': 'off' },
  },
];

export default config;
