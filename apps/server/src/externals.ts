/**
 * This file contains a list of constants that may need to be resolved at runtime
 */

// =================================================
// resolve running environment
const env = process.env.NODE_ENV || 'production';

export const isTest = Boolean(process.env.IS_TEST);
export const environment = isTest ? 'test' : env;
export const isDocker = env === 'docker';
export const isProduction = isDocker || (env === 'production' && !isTest);
