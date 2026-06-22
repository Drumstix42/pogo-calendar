import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import { includeIgnoreFile } from 'eslint/config';
import vue from 'eslint-plugin-vue';
import { fileURLToPath } from 'node:url';
import vueParser from 'vue-eslint-parser';

// Mirror .gitignore so ESLint skips build outputs and other ignored paths.
const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default [
    includeIgnoreFile(gitignorePath),
    {
        files: ['**/*.{js,ts,vue}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        plugins: {
            vue,
            '@typescript-eslint': typescript,
        },
        rules: {
            'vue/multi-word-component-names': 'off',
            'vue/no-unused-vars': 'error',
            '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
        },
    },
    {
        files: ['**/*.ts', '**/*.d.ts'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
    },
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: typescriptParser,
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
    },
];
