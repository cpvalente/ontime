import * as esbuild from 'esbuild';

const esbuildCommon = {
  logLevel: 'error',
  platform: 'node',
  target: ['node20'],
  format: 'cjs',
  bundle: true,
  minify: true,
  legalComments: 'external',
  dropLabels: ['DEV'],
};

if (process.env.NODE_ENV === 'docker') {
  await esbuild.build({
    ...esbuildCommon,
    entryPoints: ['src/index.ts'],
    outfile: 'dist/docker.cjs',
  });
} else if (process.env.NODE_ENV === 'electron') {
  await esbuild.build({
    ...esbuildCommon,
    entryPoints: ['src/app.ts'],
    outfile: 'dist/index.cjs',
  });
} else if (process.env.NODE_ENV === 'cli') {
  await esbuild.build({
    ...esbuildCommon,
    entryPoints: ['src/app.ts'],
    outfile: 'dist/index.cjs',
  });
} else {
  await esbuild.build({
    ...esbuildCommon,
    entryPoints: ['src/app.ts'],
    minify: false,
    dropLabels: [],
    outfile: 'dist/index.cjs',
  });
}
