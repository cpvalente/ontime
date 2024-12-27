import type {
  CustomFields,
  HttpSettings,
  OSCSettings,
  ProjectData,
  Settings,
  URLPreset,
  ViewSettings,
} from '../index.js';
import type { OntimeRundownDAO } from './core/Rundown.type.js';

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
