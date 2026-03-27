import { defineConfig } from 'tsdown';

const config = defineConfig({
  clean: false, // we can't use clean as it runs after the copy plugin
  entry: ['src/main.ts'],
  outDir: 'dist',
  unbundle: true,
  dts: {
    resolve: true,
    tsconfig: './tsconfig.dts.json',
    eager: true,
  },
  deps: {
    alwaysBundle: ['ontime-types'],
    onlyBundle: ['ontime-types', 'ts-essentials'],
  },
  format: 'esm',
  target: 'esnext',
  platform: 'node',
});

export default config;
