export const esbuildCommon = {
  logLevel: 'error',
  platform: 'node',
  target: ['node20'],
  format: 'cjs',
  bundle: true,
  minify: true,
  legalComments: 'external',
  dropLabels: ['DEV'],
};
