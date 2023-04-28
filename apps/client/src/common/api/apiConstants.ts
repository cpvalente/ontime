export const STATIC_PORT = 4001;

// REST stuff
export const EVENT_DATA = ['eventdata'];
export const ALIASES = ['aliases'];
export const USERFIELDS = ['userFields'];
export const RUNDOWN_TABLE_KEY = 'rundown';
export const RUNDOWN_TABLE = [RUNDOWN_TABLE_KEY];
export const APP_INFO = ['appinfo'];
export const OSC_SETTINGS = ['oscSettings'];
export const APP_SETTINGS = ['appSettings'];
export const VIEW_SETTINGS = ['viewSettings'];
export const RUNTIME = ['runtimeStore'];

export const serverPort = import.meta.env.DEV ? STATIC_PORT : window.location.port;
export const serverURL = import.meta.env.DEV ? `http://localhost:${serverPort}` : window.location.origin;
export const websocketUrl = `ws://${window.location.hostname}:${serverPort}/ws`;

export const eventURL = `${serverURL}/eventdata`;
export const rundownURL = `${serverURL}/events`;
export const ontimeURL = `${serverURL}/ontime`;

export const stylesPath = 'external/styles/override.css';
export const overrideStylesURL = `${serverURL}/${stylesPath}`;
