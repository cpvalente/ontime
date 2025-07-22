import { create } from 'zustand';

interface CuesheetPermissionsStore {
  canChangeMode: boolean;
  canCreateEntries: boolean;
  canEditEntries: boolean;
  canFlag: boolean;
  canShare: boolean;
  setPermissions: (permissions: Omit<CuesheetPermissionsStore, 'setPermissions'>) => void;
}

export const useCuesheetPermissions = create<CuesheetPermissionsStore>((set) => ({
  canChangeMode: false,
  canCreateEntries: false,
  canEditEntries: false,
  canFlag: false,
  canShare: false,
  setPermissions(permissions) {
    set({
      canChangeMode: permissions.canChangeMode,
      canFlag: permissions.canFlag,
      canCreateEntries: permissions.canCreateEntries,
      canEditEntries: permissions.canEditEntries,
      canShare: permissions.canShare,
    });
  },
}));
