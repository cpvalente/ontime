import type {
  AutomationSettings,
  CustomFields,
  ProjectData,
  ProjectRundowns,
  Settings,
  URLPreset,
  ViewSettings,
} from '../index.js';

export type DatabaseModel = {
  rundowns: ProjectRundowns;
  project: ProjectData;
  settings: Settings;
  viewSettings: ViewSettings;
  urlPresets: URLPreset[];
  customFields: CustomFields;
  automation: AutomationSettings;
};
