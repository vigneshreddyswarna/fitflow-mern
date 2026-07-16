const js = require('@eslint/js');
const globals = require('globals');
const react = require('eslint-plugin-react');

module.exports = [
  { ignores: ['node_modules/**', 'client/dist/**', 'coverage/**', 'playwright-report/**'] },
  js.configs.recommended,
  {
    files: ['server/**/*.js', 'index.js', 'playwright.config.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: { ...globals.node, ...globals.vitest } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] }
  },
  {
    files: ['tests/**/*.{js,mjs,jsx}', 'vitest.config.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.node, ...globals.browser, ...globals.vitest } },
    plugins: { react },
    rules: { ...react.configs.recommended.rules, 'react/react-in-jsx-scope': 'off', 'react/prop-types': 'off', 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] },
    settings: { react: { version: 'detect' } }
  },
  {
    files: ['client/**/*.{js,jsx}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser } },
    plugins: { react },
    rules: { ...react.configs.recommended.rules, 'react/react-in-jsx-scope': 'off', 'react/prop-types': 'off', 'react/no-unescaped-entities': 'off', 'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }], 'no-undef': 'error' },
    settings: { react: { version: 'detect' } }
  }
];
