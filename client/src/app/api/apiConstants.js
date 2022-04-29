export const NODE_PORT = 4001;
export const EVENT_TABLE = 'event';
export const ALIASES = 'aliases';
export const USERFIELDS = 'userFields';
export const EVENTS_TABLE = 'events';
export const APP_TABLE = 'appinfo';
export const OSC_SETTINGS = 'oscSettings';
export const APP_SETTINGS = 'appSettings';

/**
 * @description finds server path given the current location
 * @return {*}
 */
const calculateServer = () => {
  return window.location.origin.replace(window.location.port, `${NODE_PORT}/`);
};

export const serverURL = calculateServer();
export const eventURL = serverURL + EVENT_TABLE;
export const eventsURL = serverURL + EVENTS_TABLE;
export const playbackURL = `${serverURL}playback`;
export const ontimeURL = `${serverURL}ontime`;
