import { create } from 'zustand';

export type SettingsOption = {
  id: string;
  label: string;
  secondary?: SettingsOption[];
  split?: boolean;
};

export const settingPanels: SettingsOption[] = [
  { id: 'project', label: 'Project' },
  { id: 'general', label: 'General' },
  { id: 'interface', label: 'Interface' },
  { id: 'views', label: 'Views' },
  {
    id: 'sources',
    label: 'Data Sources',
    secondary: [{ id: 'g-sheet', label: 'Sync with Google Sheet' }],
    split: true,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    secondary: [
      { id: 'osc', label: 'OSC Integration' },
      { id: 'http', label: 'HTTP Integration' },
    ],
  },
  { id: 'log', label: 'Log', split: true },
  { id: 'about', label: 'About', split: true },
] as const;

export type SettingsOptionId = (typeof settingPanels)[number]['id'];

type SettingsStore = {
  showSettings: SettingsOptionId | null;
  setShowSettings: (panelId: SettingsOptionId | null) => void;
  hasUnsavedChanges: SettingsOptionId[];
  addUnsavedChanges: (panelId: SettingsOptionId) => void;
  removeUnsavedChanges: (panelId: SettingsOptionId) => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  showSettings: null,
  setShowSettings: (panelId: SettingsOptionId | null) => {
    set((state) => ({
      ...state,
      showSettings: panelId,
    }));
  },
  hasUnsavedChanges: [],
  addUnsavedChanges: (panelId: SettingsOptionId) =>
    set((state) => ({
      ...state,
      hasUnsavedChanges: [...state.hasUnsavedChanges, panelId],
    })),
  removeUnsavedChanges: (panelId: SettingsOptionId) =>
    set((state) => ({
      ...state,
      hasUnsavedChanges: state.hasUnsavedChanges.filter((id) => id !== panelId),
    })),
}));
