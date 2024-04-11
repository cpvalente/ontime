import { create } from 'zustand';

export type SettingsOption = {
  id: string;
  label: string;
  secondary?: Readonly<SettingsOption[]>;
  split?: boolean;
};

export const settingPanels: Readonly<SettingsOption[]> = [
  {
    id: 'project',
    label: 'Project',
    secondary: [
      { id: 'project__data', label: 'Project data' },
      { id: 'project__manage', label: 'Manage projects' },
    ],
  },
  {
    id: 'general',
    label: 'App Settings',
    secondary: [
      { id: 'general__settings', label: 'General settings' },
      { id: 'general__editor', label: 'Editor settings' },
      { id: 'general__view', label: 'View settings' },
    ],
  },
  {
    id: 'feature_settings',
    label: 'Feature Settings',
    secondary: [
      { id: 'feature_settings__custom', label: 'Custom fields' },
      { id: 'feature_settings__urlpresets', label: 'URL Presets' },
    ],
  },
  {
    id: 'sources',
    label: 'Data Sources',
    secondary: [
      { id: 'sources__xlsx', label: 'Import spreadsheet' },
      { id: 'sources__gsheet', label: 'Sync with Google Sheet' },
    ],
    split: true,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    secondary: [
      { id: 'integrations__osc', label: 'OSC settings' },
      { id: 'integrations__http', label: 'HTTP settings' },
    ],
  },
  { id: 'log', label: 'Log', split: true },
  {
    id: 'about',
    label: 'About',
    split: true,
  },
  {
    id: 'shutdown',
    label: 'Shutdown',
    split: true,
  },
] as const;

export type SettingsOptionId = (typeof settingPanels)[number]['id'];

export interface PanelBaseProps {
  location?: string;
}

type SettingsStore = {
  unsavedChanges: Set<SettingsOptionId>;
  hasUnsavedChanges: (panelId: SettingsOptionId) => boolean;
  addUnsavedChanges: (panelId: SettingsOptionId) => void;
  removeUnsavedChanges: (panelId: SettingsOptionId) => void;
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  unsavedChanges: new Set(),
  hasUnsavedChanges: (panelId: SettingsOptionId) => get().unsavedChanges.has(panelId),
  addUnsavedChanges: (panelId: SettingsOptionId) =>
    set((state) => {
      state.unsavedChanges.add(panelId);
      return { unsavedChanges: new Set(state.unsavedChanges) };
    }),
  removeUnsavedChanges: (panelId: SettingsOptionId) =>
    set((state) => {
      state.unsavedChanges.delete(panelId);
      return { unsavedChanges: new Set(state.unsavedChanges) };
    }),
}));
