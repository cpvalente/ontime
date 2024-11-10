module.exports = {
  appIni: {
    shutdownCode: 99,
  },
  reactAppUrl: {
    development: (port = 3000) => `http://localhost:${port}`,
    production: (port = 4001) => `http://localhost:${port}`,
  },
  server: {
    pathToEntrypoint: '../../extraResources/server/index.cjs',
  },
  assets: {
    pathToAssets: './assets/',
  },
};
