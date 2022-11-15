export const STATIC_PORT = 4001;
export const EVENT_TABLE = ['event'];
export const ALIASES = ['aliases'];
export const USERFIELDS = ['userFields'];
export const EVENTS_TABLE_KEY = 'events';
export const EVENTS_TABLE = [EVENTS_TABLE_KEY];
export const APP_INFO = ['appinfo'];
export const OSC_SETTINGS = ['oscSettings'];
export const APP_SETTINGS = ['appSettings'];
export const VIEW_SETTINGS = ['viewSettings'];

export const FEAT_RUNDOWN = 'ontime-feat-eventlist';
export const FEAT_MESSAGECONTROL = 'ontime-feat-messagecontrol';
export const FEAT_PLAYBACKCONTROL = 'ontime-feat-playbackcontrol';
export const FEAT_INFO = 'ontime-feat-info';
export const FEAT_CUESHEET = 'ontime-feat-cuesheet';
export const TIMER = 'ontime-timer';

/**
 * @description finds server path given the current location, it
 * @return {*}
 */
export const calculateServer = () =>
  import.meta.env.DEV ? `http://localhost:${STATIC_PORT}` : window.location.origin;

export const serverURL = calculateServer();
export const eventURL = `${serverURL}/${EVENT_TABLE}`;
export const eventsURL = `${serverURL}/${EVENTS_TABLE}`;
export const ontimeURL = `${serverURL}/ontime`;

export const stylesPath = 'external/styles/override.css';
export const overrideStylesURL = `serverURL/${stylesPath}`;
