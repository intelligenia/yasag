import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Lean modern lint (replaces deprecated TSLint). Focuses on real-bug rules
// (shadowing, unused vars) without churning the existing `any`-heavy generator.
export default tseslint.config(
  { ignores: ['dist/**', 'demo/**', 'node_modules/**', '.e2e-tmp/**', '.e2e-out/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-undef': 'off', // TypeScript already resolves identifiers/types.
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
