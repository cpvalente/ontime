import copyPlugin from '@sprout2000/esbuild-copy-plugin';
import { defineConfig } from 'tsup';

const config = defineConfig({
  clean: false, // we can't use clean as it runs after the copy plugin
  entry: ['src/main.ts'],
  outDir: 'dist',
  bundle: true,

  dts: { resolve: true, tsconfig: './tsconfig.dts.json' },
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

export default config;
