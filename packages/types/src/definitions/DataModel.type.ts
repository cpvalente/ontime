import { Alias } from './core/Alias.type.js';
import { EventData } from './core/EventData.type.js';
import { OntimeRundown } from './core/Rundown.type.js';
import { OSCSettings } from './core/OscSettings.type.js';
import { Settings } from './core/Settings.type.js';
import { UserFields } from './core/UserFields.type.js';
import { ViewSettings } from './core/Views.type.js';
import { SyncSettings } from './core/SyncSettings.type.js';

export type DatabaseModel = {
  rundown: OntimeRundown;
  eventData: EventData;
  settings: Settings;
  viewSettings: ViewSettings;
  syncSettings: SyncSettings;
  aliases: Alias[];
  userFields: UserFields;
  osc: OSCSettings;
};
