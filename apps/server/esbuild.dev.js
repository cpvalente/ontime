import * as esbuild from 'esbuild';
import { esbuildCommon } from './esbuildCommon.js';

await esbuild.build({
  ...esbuildCommon,
  entryPoints: ['src/app.ts'],
  minify: false,
  dropLabels: [],
  outfile: 'dist/index.cjs',
});
