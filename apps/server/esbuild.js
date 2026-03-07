import * as esbuild from 'esbuild';

const isDocker = process.env.NODE_ENV === 'docker';

await esbuild.build({
  logLevel: 'error',
  platform: 'node',
  target: ['node20'],
  format: 'cjs',
  bundle: true,
  minify: true,
  legalComments: 'external',
  dropLabels: ['DEV'],
  entryPoints: isDocker ? ['src/index.ts'] : ['src/app.ts'],
  outfile: isDocker ? 'dist/docker.cjs' : 'dist/index.cjs',
});
