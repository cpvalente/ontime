import type {
  CustomFields,
  HttpSettings,
  OntimeRundownDAO,
  OSCSettings,
  ProjectData,
  Settings,
  URLPreset,
  ViewSettings,
} from '../index.js';

export type DatabaseModel = {
  rundown: OntimeRundownDAO;
  project: ProjectData;
  settings: Settings;
  viewSettings: ViewSettings;
  urlPresets: URLPreset[];
  customFields: CustomFields;
  osc: OSCSettings;
  http: HttpSettings;
};
