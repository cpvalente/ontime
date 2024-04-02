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
    secondary: [{ id: 'project__manage', label: 'Manage project files' }],
  },
  {
    id: 'general',
    label: 'General',
    secondary: [
      { id: 'general__manage', label: 'Manage Ontime settings' },
      { id: 'general__view', label: 'View settings' },
      { id: 'general__urlpresets', label: 'URL presets' },
    ],
  },
  {
    id: 'project_settings',
    label: 'Project Settings',
    secondary: [{ id: 'project_settings__custom', label: 'Custom fields' }],
  },
  { id: 'interface', label: 'Interface', secondary: [{ id: 'interface__editor', label: 'Editor settings' }] },
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
  {
    id: 'network',
    label: 'Network',
    split: true,
    secondary: [
      {
        id: 'network__log',
        label: 'Application log',
      },
      {
        id: 'network__clients',
        label: 'Manage clients',
      },
    ],
  },
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
