import type {
  AutomationSettings,
  CustomFields,
  HttpSettings,
  OntimeRundown,
  OSCSettings,
  ProjectData,
  Settings,
  URLPreset,
  ViewSettings,
} from '../index.js';

export type DatabaseModel = {
  rundown: OntimeRundown;
  project: ProjectData;
  settings: Settings;
  viewSettings: ViewSettings;
  urlPresets: URLPreset[];
  customFields: CustomFields;
  osc: OSCSettings;
  http: HttpSettings;
  automation: AutomationSettings;
};
