export const STATIC_PORT = 4001;
export const EVENT_TABLE = ['event'];
export const ALIASES = ['aliases'];
export const USERFIELDS = ['userFields'];
export const EVENTS_TABLE_KEY = 'events';
export const EVENTS_TABLE = [EVENTS_TABLE_KEY];
export const APP_TABLE = ['appinfo'];
export const OSC_SETTINGS = ['oscSettings'];
export const APP_SETTINGS = ['appSettings'];
export const VIEW_SETTINGS = ['viewSettings'];

export const FEAT_EVENTLIST = ['feat-eventList'];
export const FEAT_MESSAGECONTROL = ['feat-messagecontrol'];
export const FEAT_PLAYBACKCONTROL = ['feat-playbackcontrol'];
export const FEAT_INFO = ['feat-info'];
export const FEAT_CUESHEET = ['feat-cuesheet'];
export const TIMER = ['ontime-timer'];

/**
 * @description finds server path given the current location, it
 * @return {*}
 */
export const calculateServer = () =>
  import.meta.env.DEV ? `http://localhost:${STATIC_PORT}` : window.location.origin;

export const serverURL = calculateServer();
export const eventURL = `${serverURL}/${EVENT_TABLE}`;
export const eventsURL = `${serverURL}/${EVENTS_TABLE}`;
export const playbackURL = `${serverURL}/playback`;
export const ontimeURL = `${serverURL}/ontime`;

export const stylesPath = 'external/styles/override.css';
export const overrideStylesURL = `${serverURL}/${stylesPath}`;
