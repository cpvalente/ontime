import { AuthenticationStatus, CustomFields, OntimeRundown } from 'ontime-types';
import { defaultExcelImportMap, ExcelImportMap } from 'ontime-utils';
import { create } from 'zustand';

// TODO: persist excelFileOptions to localStorage

type SheetStore = {
  stepData: typeof initialStepData;
  patchStepData: (patch: Partial<typeof initialStepData>) => void;

  sheetId: string | null;
  setSheetId: (sheetId: string | null) => void;

  authenticationStatus: AuthenticationStatus;
  setAuthenticationStatus: (status: AuthenticationStatus) => void;

  rundown: OntimeRundown | null;
  setRundown: (rundown: OntimeRundown | null) => void;

  customFields: CustomFields | null;
  setCustomFields: (customFields: CustomFields | null) => void;

  worksheetOptions: string[] | null;
  setWorksheetOptions: (worksheetOptions: string[] | null) => void;

  excelFileOptions: ExcelImportMap;
  patchExcelFileOptions: <T extends keyof ExcelImportMap>(field: T, value: ExcelImportMap[T]) => void;

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
  sheetId: null,
  authenticationStatus: 'not_authenticated' as AuthenticationStatus,
  rundown: null,
  customFields: null,
  worksheetOptions: null,
  excelFileOptions: defaultExcelImportMap,
};

export const useSheetStore = create<SheetStore>((set, get) => ({
  ...initialState,

  patchStepData: (patch: Partial<typeof initialStepData>) => {
    const stepData = get().stepData;
    set({ stepData: { ...stepData, ...patch } });
  },

  setSheetId: (sheetId: string | null) => set({ sheetId }),

  setAuthenticationStatus: (status: AuthenticationStatus) => set({ authenticationStatus: status }),

  setRundown: (rundown: OntimeRundown | null) => set({ rundown }),

  setCustomFields: (customFields: CustomFields | null) => set({ customFields }),

  setWorksheetOptions: (worksheetOptions: string[] | null) => set({ worksheetOptions }),

  patchExcelFileOptions: <T extends keyof ExcelImportMap>(field: T, value: ExcelImportMap[T]) => {
    const excelFileOptions = get().excelFileOptions;
    if (excelFileOptions[field] !== value) {
      excelFileOptions[field] = value;
    }
  },

  reset: () => set(initialState),
  resetPreview: () => set({ rundown: null, customFields: null }),
}));
