module.exports = {
  appIni: {
    shutdownCode: 99,
  },
  reactAppUrl: {
    development: 'http://localhost:3000/editor',
    production: 'http://localhost:4001/editor',
  },
  server: {
    pathToEntrypoint: '../extraResources/server/index.cjs'
  },
  assets: {
    pathToAssets: './assets/',
  }
};
