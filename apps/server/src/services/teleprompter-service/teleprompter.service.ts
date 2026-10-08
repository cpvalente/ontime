import { RefetchKey, type TeleprompterScript, type TeleprompterSettings } from 'ontime-types';

import { sendRefetch } from '../../adapters/WebsocketAdapter.js';
import { getCurrentRundown, getProjectCustomFields } from '../../api-data/rundown/rundown.dao.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { buildScriptEvents } from './teleprompter.utils.js';

let sharedScript: TeleprompterScript = { revision: 0, charsPerLine: 0, events: [] };

function getSharedSettings(): TeleprompterSettings {
  return getDataProvider().getViewSettings().teleprompter;
}

/** The script every remote screen and controller shows, built from the project's settings */
export function getSharedScript(): TeleprompterScript {
  return sharedScript;
}

/** A script built with a view's own settings, at the revision of the shared one */
export function buildScriptWith(settings: TeleprompterSettings): TeleprompterScript {
  return {
    revision: sharedScript.revision,
    charsPerLine: settings.charsPerLine,
    events: buildScriptEvents(getCurrentRundown(), getProjectCustomFields(), settings),
  };
}

/**
 * Rebuilds the script after the rundown or the settings changed
 * Screens are told to refetch it, the script itself is never pushed over the websocket
 */
export function refreshTeleprompterScript() {
  const settings = getSharedSettings();
  sharedScript = {
    revision: sharedScript.revision + 1,
    charsPerLine: settings.charsPerLine,
    events: buildScriptEvents(getCurrentRundown(), getProjectCustomFields(), settings),
  };
  sendRefetch(RefetchKey.Teleprompter, sharedScript.revision);
}
