import * as esbuild from 'esbuild';
import { esbuildCommon } from './esbuildCommon.js';

await esbuild.build({
  ...esbuildCommon,
  entryPoints: ['src/app.ts'],
  outfile: 'dist/index.cjs',
});
