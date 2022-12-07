export const STATIC_PORT = 4001;

// REST stuff
export const EVENT_TABLE = ['event'];
export const ALIASES = ['aliases'];
export const USERFIELDS = ['userFields'];
export const RUNDOWN_TABLE_KEY = 'rundown';
export const RUNDOWN_TABLE = [RUNDOWN_TABLE_KEY];
export const APP_INFO = ['appinfo'];
export const OSC_SETTINGS = ['oscSettings'];
export const APP_SETTINGS = ['appSettings'];
export const VIEW_SETTINGS = ['viewSettings'];

// websocket stuff
export const FEAT_CUESHEET = 'feat-cuesheet';
export const FEAT_INFO = 'feat-info';
export const FEAT_MESSAGECONTROL = 'feat-messagecontrol';
export const FEAT_PLAYBACKCONTROL = 'feat-playbackcontrol';
export const FEAT_RUNDOWN = 'feat-rundown';
export const TIMER = 'ontime-timer';

/**
 * @description finds server path given the current location, it
 * @return {*}
 */
export const calculateServer = () =>
  import.meta.env.DEV ? `http://localhost:${STATIC_PORT}` : window.location.origin;

export const serverURL = calculateServer();
export const eventURL = `${serverURL}/event`;
export const rundownURL = `${serverURL}/eventlist`;
export const ontimeURL = `${serverURL}/ontime`;

export const stylesPath = 'external/styles/override.css';
export const overrideStylesURL = `${serverURL}/${stylesPath}`;
