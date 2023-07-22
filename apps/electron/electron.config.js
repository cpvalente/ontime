module.exports = {
  appIni: {
    shutdownCode: 99,
  },
  reactAppUrl: {
    development: 'http://localhost:3000/editor',
    production: (port = 4001) => `http://localhost:${port}/editor`,
  },
  server: {
    pathToEntrypoint: '../extraResources/server/index.cjs',
  },
  assets: {
    pathToAssets: './assets/',
  },
};
