import next from 'eslint-config-next';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...next,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
    ],
    rules: {
      // We acknowledge certain setState in effects guarded by async callbacks
      'react-hooks/set-state-in-effect': 'off',
      // Allow our helper to wrap useMemo; call sites must still adhere
      'react-hooks/use-memo': 'off',
      // React purity: allow Math.random within ref init guarded outside render path
      'react-hooks/purity': 'error',
    },
  },
];
