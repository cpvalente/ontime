// resolve running environment
const env = process.env.NODE_ENV || 'production';

export const isTest = Boolean(process.env.IS_TEST);
export const environment = isTest ? 'test' : env;
export const isDocker = env === 'docker';
export const isProduction = isDocker || (env === 'production' && !isTest);
export const isOntimeCloud = Boolean(process.env.IS_CLOUD);
export const isSyncHost = Boolean(process.env.HOST_SYNC);

export const override_port = process.env.PORT ? Number(process.env.PORT) : undefined;
