module.exports = {
  printWidth: 80,
  tabWidth: 2,
  trailingComma: 'all',
  singleQuote: true,
  semi: true,
  importOrder: ['^@/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  overrides: [
    {
      files: '*.{ts,tsx}',
      options: {
        parser: 'babel-ts',
      },
    },
  ],
};
