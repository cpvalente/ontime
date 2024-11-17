import { serverURL } from '../../externals';

// keys in tanstack store
export const APP_INFO = ['appinfo'];
export const APP_SETTINGS = ['appSettings'];
export const APP_VERSION = ['appVersion'];
export const CUSTOM_FIELDS = ['customFields'];
export const HTTP_SETTINGS = ['httpSettings'];
export const OSC_SETTINGS = ['oscSettings'];
export const PROJECT_DATA = ['project'];
export const PROJECT_LIST = ['projectList'];
export const RUNDOWN = ['rundown'];
export const RUNTIME = ['runtimeStore'];
export const SHEET_STATE = ['sheetState'];
export const URL_PRESETS = ['urlpresets'];
export const VIEW_SETTINGS = ['viewSettings'];
export const CLIENT_LIST = ['clientList'];

// API URLs
export const apiEntryUrl = `${serverURL}/data`;

export const projectDataURL = `${serverURL}/project`;
export const rundownURL = `${serverURL}/events`;
export const ontimeURL = `${serverURL}/ontime`;

export const userAssetsPath = 'user';
export const cssOverridePath = 'styles/override.css';
export const overrideStylesURL = `${serverURL}/${userAssetsPath}/${cssOverridePath}`;
