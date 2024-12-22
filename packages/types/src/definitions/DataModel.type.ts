import type {
  CustomFields,
  DatabaseOntimeRundown,
  HttpSettings,
  OSCSettings,
  ProjectData,
  Settings,
  URLPreset,
  ViewSettings,
} from '../index.js';

export type DatabaseModel = {
  rundown: DatabaseOntimeRundown;
  project: ProjectData;
  settings: Settings;
  viewSettings: ViewSettings;
  urlPresets: URLPreset[];
  customFields: CustomFields;
  osc: OSCSettings;
  http: HttpSettings;
};
