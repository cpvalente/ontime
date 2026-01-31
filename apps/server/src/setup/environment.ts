// resolve running environment
const env = process.env.NODE_ENV || 'production';

export const isTest = Boolean(process.env.IS_TEST);
export const environment = isTest ? 'test' : env;
export const isDocker = env === 'docker';
export const isProduction = isDocker || (env === 'production' && !isTest);
export const isOntimeCloud = Boolean(process.env.IS_CLOUD);

export const startUpPort = parsePort(process.env.PORT);

function parsePort(port: string | undefined) {
  if (typeof port !== 'string') return null;
  if (port === '') return null;
  const maybePort = Number(port);
  if (isNaN(maybePort)) return null;
  return maybePort;
}
