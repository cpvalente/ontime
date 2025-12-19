import { defineConfig } from 'tsup';
import copyPlugin from '@sprout2000/esbuild-copy-plugin';

export default defineConfig({
  clean: false, // we can't use clean as it runs after the copy plugin
  entry: ['src/main.ts'],
  outDir: 'dist',
  bundle: true,

  dts: { resolve: true },
  format: 'esm',
  target: 'esnext',
  platform: 'node',
  esbuildPlugins: [
    copyPlugin.copyPlugin({
      src: './node_modules/ontime-types/dist',
      dest: './dist',
    }),
  ],
});
