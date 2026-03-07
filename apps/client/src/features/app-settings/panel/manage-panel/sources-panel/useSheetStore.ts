import { AuthenticationStatus, CustomFields, Rundown, RundownSummary } from 'ontime-types';
import { ImportMap, defaultImportMap } from 'ontime-utils';
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

  // we get this from a preview response
  rundown: Rundown | null;
  setRundown: (rundown: Rundown | null) => void;
  customFields: CustomFields | null;
  setCustomFields: (customFields: CustomFields | null) => void;
  summary: RundownSummary | null;
  setSummary: (metadata: RundownSummary | null) => void;

  spreadsheetImportMap: ImportMap;
  patchSpreadsheetImportMap: <T extends keyof ImportMap>(field: T, value: ImportMap[T]) => void;

  reset: () => void;
  resetPreview: () => void;
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
  rundown: null,
  customFields: null,
  summary: null,
  spreadsheetImportMap: defaultImportMap,
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

  setRundown: (rundown: Rundown | null) => set({ rundown }),

  setCustomFields: (customFields: CustomFields | null) => set({ customFields }),

  setSummary: (summary: RundownSummary | null) => set({ summary }),

  patchSpreadsheetImportMap: <T extends keyof ImportMap>(field: T, value: ImportMap[T]) => {
    const currentImportMap = get().spreadsheetImportMap;
    if (currentImportMap[field] !== value) {
      currentImportMap[field] = value;
    }
  },

  reset: () => set(initialState),
  resetPreview: () => set({ rundown: null, customFields: null, summary: null }),
}));
