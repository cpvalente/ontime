import { serverURL } from '../../externals';

// keys in tanstack store
export const APP_INFO = ['appinfo'];
export const APP_SETTINGS = ['appSettings'];
export const APP_VERSION = ['appVersion'];
export const AUTOMATION = ['automation'];
export const CUSTOM_FIELDS = ['customFields'];
export const PROJECT_DATA = ['project'];
export const PROJECT_LIST = ['projectList'];
export const PROJECT_RUNDOWNS = ['projectRundowns'];
export const RUNDOWN = ['rundown'];
export const RUNTIME = ['runtimeStore'];
export const URL_PRESETS = ['urlpresets'];
export const VIEW_SETTINGS = ['viewSettings'];
export const CLIENT_LIST = ['clientList'];
export const REPORT = ['report'];
export const TRANSLATION = ['translation'];
export const CSS_OVERRIDE = ['cssOverride']

// API URLs
export const apiEntryUrl = `${serverURL}/data`;

const userAssetsPath = 'user';
const customTranslationsPath = 'translations/translations.json';

export const projectLogoPath = `${serverURL}/${userAssetsPath}/logo`;
export const customTranslationsURL = `${serverURL}/${userAssetsPath}/${customTranslationsPath}`;
