import { AuthenticationStatus, CustomFields, OntimeRundown } from 'ontime-types';
import { defaultImportMap, ImportMap } from 'ontime-utils';
import { create } from 'zustand';

type SheetStore = {
  stepData: typeof initialStepData;
  patchStepData: (patch: Partial<typeof initialStepData>) => void;
  setWorksheets: (worksheetNames: string[] | null) => void;
  worksheetNames: string[] | null;

  //Excel
  excel: string | null;
  setExcel: (spreadsheet: string | null) => void;

  //gSheet
  sheetId: string | null;
  setSheetId: (sheetId: string | null) => void;
  authenticationStatus: AuthenticationStatus;
  setAuthenticationStatus: (status: AuthenticationStatus) => void;

  // we get this from a preview response
  rundown: OntimeRundown | null;
  setRundown: (rundown: OntimeRundown | null) => void;

  // we get this from a preview response
  customFields: CustomFields | null;
  setCustomFields: (customFields: CustomFields | null) => void;

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
  excel: null,
  worksheetNames: null,
  sheetId: null,
  authenticationStatus: 'not_authenticated' as AuthenticationStatus,
  rundown: null,
  customFields: null,
  spreadsheetImportMap: defaultImportMap,
};

export const useSheetStore = create<SheetStore>((set, get) => ({
  ...initialState,

  patchStepData: (patch: Partial<typeof initialStepData>) => {
    const stepData = get().stepData;
    set({ stepData: { ...stepData, ...patch } });
  },

  setWorksheets: (worksheetNames: string[] | null) => set({ worksheetNames }),

  setExcel: (excel: string | null) => set({ excel }),

  setSheetId: (sheetId: string | null) => set({ sheetId }),

  setAuthenticationStatus: (status: AuthenticationStatus) => set({ authenticationStatus: status }),

  setRundown: (rundown: OntimeRundown | null) => set({ rundown }),

  setCustomFields: (customFields: CustomFields | null) => set({ customFields }),

  patchSpreadsheetImportMap: <T extends keyof ImportMap>(field: T, value: ImportMap[T]) => {
    const currentImportMap = get().spreadsheetImportMap;
    if (currentImportMap[field] !== value) {
      currentImportMap[field] = value;
    }
  },

  reset: () => set(initialState),
  resetPreview: () => set({ rundown: null, customFields: null }),
}));
