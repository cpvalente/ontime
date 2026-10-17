import type { AutomationSettings } from './core/Automation.type.js';
import type { ProjectCustomFields } from './core/CustomFields.type.js';
import type { ProjectData } from './core/ProjectData.type.js';
import type { ProjectRundowns } from './core/Rundown.type.js';
import type { Settings } from './core/Settings.type.js';
import type { URLPreset } from './core/UrlPreset.type.js';
import type { ViewSettings } from './core/Views.type.js';

export type DatabaseModel = {
  rundowns: ProjectRundowns;
  project: ProjectData;
  settings: Settings;
  viewSettings: ViewSettings;
  urlPresets: URLPreset[];
  customFields: ProjectCustomFields;
  automation: AutomationSettings;
};
