// resolve running environment
const env = process.env.NODE_ENV || 'production';

export const isTest = Boolean(process.env.IS_TEST);
export const environment = isTest ? 'test' : env;
export const isDocker = env === 'docker';
export const isProduction = isDocker || (env === 'production' && !isTest);
export const isOntimeCloud = Boolean(process.env.IS_CLOUD);

export const envPort = process.env.PORT;

/**
 * How this server is distributed
 * cloud and docker are set in their environment, electron loads the server in its own process
 * anything else is a node process: the npm package or a self hosted build
 */
function getHost(): 'cloud' | 'docker' | 'electron' | 'node' {
  if (isOntimeCloud) return 'cloud';
  if (isDocker) return 'docker';
  if (process.versions.electron) return 'electron';
  return 'node';
}

/** describes the system the server runs in, values absent on this host are left out of logs */
export const systemInfo = {
  host: getHost(),
  environment,
  platform: `${process.platform}-${process.arch}`,
  node: process.version,
  electron: process.versions.electron,
};
