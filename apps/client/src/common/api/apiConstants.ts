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

const location = window.location;
const socketProtocol = location.protocol === 'https:' ? 'wss' : 'ws';
export const isProduction = import.meta.env.MODE === 'production';

const STATIC_PORT = 4001;
export const serverPort = isProduction ? location.port : STATIC_PORT;
export const serverURL = `${location.protocol}//${location.hostname}:${serverPort}`;
export const websocketUrl = `${socketProtocol}://${location.hostname}:${serverPort}/ws`;

export const eventURL = `${serverURL}/eventdata`;
export const rundownURL = `${serverURL}/events`;
export const ontimeURL = `${serverURL}/ontime`;

export const stylesPath = 'external/styles/override.css';
export const overrideStylesURL = `${serverURL}/${stylesPath}`;
