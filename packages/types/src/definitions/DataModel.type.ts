import {
  CustomFields,
  PresetEvents,
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
  presetEvents: PresetEvents;
  osc: OSCSettings;
  http: HttpSettings;
};
