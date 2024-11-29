import * as esbuild from 'esbuild';
import { esbuildCommon } from './esbuildCommon.js';

await esbuild.build({
  ...esbuildCommon,
  entryPoints: ['src/index.ts'],
  outfile: 'dist/docker.cjs',
});
