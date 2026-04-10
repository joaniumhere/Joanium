export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'Data/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {},
  },
];
