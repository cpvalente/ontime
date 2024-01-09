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
  { id: 'general', label: 'General' },
  { id: 'interface', label: 'Interface' },
  { id: 'views', label: 'Views' },
  {
    id: 'sources',
    label: 'Data Sources',
    secondary: [{ id: 'sources__gsheet', label: 'Sync with Google Sheet' }],
    split: true,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    secondary: [
      { id: 'integrations__osc', label: 'OSC Integration' },
      { id: 'integrations__http', label: 'HTTP Integration' },
    ],
  },
  { id: 'log', label: 'Log', split: true },
  {
    id: 'about',
    label: 'About',
    split: true,
  },
] as const;

export type SettingsOptionId = (typeof settingPanels)[number]['id'];
const firstPanel = settingPanels[0].id;

type SettingsStore = {
  showSettings: SettingsOptionId | null;
  setShowSettings: (panelId?: SettingsOptionId | null) => void;
  unsavedChanges: Set<SettingsOptionId>;
  hasUnsavedChanges: (panelId: SettingsOptionId) => boolean;
  addUnsavedChanges: (panelId: SettingsOptionId) => void;
  removeUnsavedChanges: (panelId: SettingsOptionId) => void;
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  showSettings: null,
  setShowSettings: (panelId?: SettingsOptionId | null) => {
    const newPanel = panelId === undefined ? firstPanel : panelId;
    set((state) => {
      return {
        ...state,
        showSettings: newPanel,
      };
    });
  },
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
