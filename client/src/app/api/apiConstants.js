export const DEV_PORT = 3000;
export const EVENT_TABLE = 'event';
export const ALIASES = 'aliases';
export const USERFIELDS = 'userFields';
export const EVENTS_TABLE = 'events';
export const APP_TABLE = 'appinfo';
export const OSC_SETTINGS = 'oscSettings';
export const APP_SETTINGS = 'appSettings';

/**
 * @description finds server path given the current location, it
 * @return {*}
 */
const calculateServer = () => {
  let origin = window.location.origin;
  if (process.env?.NODE_ENV === 'development') {
    origin = window.location.origin.replace(window.location.port, `${DEV_PORT}`);
  }
  return origin;
};

export const serverURL = calculateServer();
export const eventURL = `${serverURL}/${EVENT_TABLE}`;
export const eventsURL = `${serverURL}/${EVENTS_TABLE}`;
export const playbackURL = `${serverURL}/playback`;
export const ontimeURL = `${serverURL}/ontime`;
