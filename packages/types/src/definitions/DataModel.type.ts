import type {
  AutomationSettings,
  CustomFields,
  OffsetMode,
  OntimeRundown,
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
  automation: AutomationSettings;
  offsetMode: OffsetMode;
};
