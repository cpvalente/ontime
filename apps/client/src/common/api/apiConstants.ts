export const STATIC_PORT = 4001;

// REST stuff
export const EVENTDATA_TABLE = ['eventdata'];
export const ALIASES = ['aliases'];
export const USERFIELDS = ['userFields'];
export const RUNDOWN_TABLE_KEY = 'rundown';
export const RUNDOWN_TABLE = [RUNDOWN_TABLE_KEY];
export const APP_INFO = ['appinfo'];
export const OSC_SETTINGS = ['oscSettings'];
export const APP_SETTINGS = ['appSettings'];
export const VIEW_SETTINGS = ['viewSettings'];
export const RUNTIME = ['runtimeStore'];

// external stuff
export const githubURL = 'https://api.github.com/repos/cpvalente/ontime/releases/latest';

/**
 * @description finds server path given the current location, it
 * @return {*}
 */
export const calculateServer = () => (import.meta.env.DEV ? `http://localhost:${STATIC_PORT}` : window.location.origin);

export const serverURL = calculateServer();
export const websocketUrl = `ws://${window.location.hostname}:${STATIC_PORT}/ws`;

export const eventURL = `${serverURL}/eventdata`;
export const rundownURL = `${serverURL}/events`;
export const ontimeURL = `${serverURL}/ontime`;

export const stylesPath = 'external/styles/override.css';
export const overrideStylesURL = `${serverURL}/${stylesPath}`;
