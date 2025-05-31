import { serverURL } from '../../externals';

// keys in tanstack store
export const RUNTIME = ['runtimeStore'];
export const CLIENT_LIST = ['clientList'];

// API URLs
export const apiEntryUrl = `${serverURL}/data`;

const userAssetsPath = 'user';
const cssOverridePath = 'styles/override.css';

export const overrideStylesURL = `${serverURL}/${userAssetsPath}/${cssOverridePath}`;
export const projectLogoPath = `${serverURL}/${userAssetsPath}/logo`;
