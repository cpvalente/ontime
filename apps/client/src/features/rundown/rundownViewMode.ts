export const RUNDOWN_VIEW_MODES = ['list', 'table'] as const;
export type RundownViewMode = (typeof RUNDOWN_VIEW_MODES)[number];

export const DEFAULT_RUNDOWN_VIEW_MODE: RundownViewMode = 'list';
export const RUNDOWN_VIEW_MODE_STORAGE_KEY = 'rundown-view-mode';
