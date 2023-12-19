import { Alias } from './core/Alias.type.js';
import { ProjectData } from './core/ProjectData.type.js';
import { OntimeRundown } from './core/Rundown.type.js';
import { OSCSettings } from './core/OscSettings.type.js';
import { Settings } from './core/Settings.type.js';
import { UserFields } from './core/UserFields.type.js';
import { ViewSettings } from './core/Views.type.js';
import { HttpSettings } from '../index.js';

export type DatabaseModel = {
  rundown: OntimeRundown;
  project: ProjectData;
  settings: Settings;
  viewSettings: ViewSettings;
  aliases: Alias[];
  userFields: UserFields;
  osc: OSCSettings;
  http: HttpSettings;
};
