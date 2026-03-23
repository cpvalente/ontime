import { AuthenticationStatus } from 'ontime-types';
import { create } from 'zustand';

type SheetStore = {
  stepData: typeof initialStepData;
  patchStepData: (patch: Partial<typeof initialStepData>) => void;
  setWorksheets: (worksheetNames: string[] | null) => void;
  worksheetNames: string[] | null;

  //gSheet
  sheetId: string | null;
  setSheetId: (sheetId: string | null) => void;
  authenticationStatus: AuthenticationStatus;
  setAuthenticationStatus: (status: AuthenticationStatus) => void;

  reset: () => void;
};

const initialStepData = {
  authenticate: { available: false, error: '' },
  sheetId: { available: false, error: '' },
  worksheet: { available: false, error: '' },
  pullPush: { available: false, error: '' },
};

const initialState = {
  stepData: initialStepData,
  worksheetNames: null,
  sheetId: null,
  authenticationStatus: 'not_authenticated' as AuthenticationStatus,
};

export const useSheetStore = create<SheetStore>((set, get) => ({
  ...initialState,

  patchStepData: (patch: Partial<typeof initialStepData>) => {
    const stepData = get().stepData;
    set({ stepData: { ...stepData, ...patch } });
  },

  setWorksheets: (worksheetNames: string[] | null) => set({ worksheetNames }),

  setSheetId: (sheetId: string | null) => set({ sheetId }),

  setAuthenticationStatus: (status: AuthenticationStatus) => set({ authenticationStatus: status }),

  reset: () => set(initialState),
}));
