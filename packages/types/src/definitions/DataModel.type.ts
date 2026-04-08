import type {
  AutomationSettings,
  CustomFields,
  OntimeRundown,
  ProjectData,
  QlabSettings,
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
  automation: AutomationSettings;
  qlab: QlabSettings;
};
