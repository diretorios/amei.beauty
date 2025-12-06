import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
        h: 'readonly', // Preact's h function
        preact: 'readonly' // Preact import
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin
    },
    settings: {
      react: {
        pragma: 'h', // Preact uses 'h' instead of 'React.createElement'
        version: '18.0' // Set a version to avoid warning (not used for Preact)
      }
    },
    rules: {
      // TypeScript ESLint rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      
      // React/Preact rules (configured for Preact)
      'react/jsx-key': 'error',
      'react/no-unknown-property': ['error', { ignore: ['class'] }],
      'react/react-in-jsx-scope': 'off', // Not needed for Preact
      'react/prop-types': 'off', // Using TypeScript for types
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // General rules - disable no-undef for TypeScript files (TypeScript handles this)
      'no-undef': 'off', // TypeScript compiler handles undefined variables
      'no-unused-vars': 'off' // Use TypeScript version instead
    }
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        expect: 'readonly',
        test: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly' // Vitest
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ]
    }
  },
  prettierConfig,
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts', 'eslint.config.js']
  }
];
