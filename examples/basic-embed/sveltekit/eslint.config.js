// Canonical ESLint flat config for Liforma SvelteKit app repos.
// Copied to each app repo by scripts/sync-eslint-config.sh
// @ts-check
import eslint from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';
import ts from 'typescript-eslint';

export default ts.config(
	{
		ignores: ['.svelte-kit/**', '.vercel/**', 'build/**', 'node_modules/**', 'static/**']
	},
	eslint.configs.recommended,
	...ts.configs.recommended,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			// Enforce resolve() on goto/pushState/replaceState; static in-app <a href> are fine.
			'svelte/no-navigation-without-resolve': [
				'error',
				{ ignoreGoto: false, ignoreLinks: true, ignorePushState: false, ignoreReplaceState: false }
			]
		}
	},
	...svelte.configs['flat/recommended'],
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: ts.parser,
				extraFileExtensions: ['.svelte']
			},
			globals: { ...globals.browser }
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'error'
		}
	}
);
