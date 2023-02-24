import { Alias } from './core/Alias.type.js';
import { EventData } from './core/EventData.type.js';
import { OntimeRundown } from './core/Rundown.type.js';
import { OSCSettings } from './core/OscSettings.type.js';
import { Settings } from './core/Settings.type';
import { UserFields } from './core/UserFields.type.js';
import { ViewSettings } from './core/Views.type.js';

export type DatabaseModel = {
  rundown: OntimeRundown;
  event: EventData;
  settings: Settings;
  views: ViewSettings;
  aliases: Alias[];
  userFields: UserFields;
  osc: OSCSettings;
  http: any;
};
