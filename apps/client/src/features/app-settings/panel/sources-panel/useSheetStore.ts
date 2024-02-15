import { OntimeRundown, UserFields } from 'ontime-types';
import { defaultExcelImportMap, ExcelImportMap } from 'ontime-utils';
import { create } from 'zustand';

// TODO: persist excelFileOptions to localStorage

type SheetStore = {
  clientSecret: File | null;
  rundown: OntimeRundown | null;
  userFields: UserFields | null;
  worksheet: string | null;
  worksheetOptions: string[] | null;
  excelFileOptions: ExcelImportMap;
  stepData: typeof initialStepData;
  setClientSecret: (clientSecret: File | null) => void;
  setRundown: (rundown: OntimeRundown | null) => void;
  setUserFields: (userFields: UserFields | null) => void;
  setWorksheet: (worksheet: string) => void;
  setWorksheetOptions: (worksheetOptions: string[] | null) => void;
  patchExcelFileOptions: <T extends keyof ExcelImportMap>(field: T, value: ExcelImportMap[T]) => void;
  patchStepData: (patch: Partial<typeof initialStepData>) => void;
  reset: () => void;
  resetPreview: () => void;
};

const initialStepData = {
  clientSecret: { available: true, error: '' },
  authenticate: { available: false, error: '' },
  sheetId: { available: false, error: '' },
  worksheet: { available: false, error: '' },
  pullPush: { available: false, error: '' },
};

const initialState = {
  clientSecret: null,
  rundown: null,
  userFields: null,
  worksheet: null,
  worksheetOptions: null,
  excelFileOptions: defaultExcelImportMap,
  stepData: initialStepData,
};

export const useSheetStore = create<SheetStore>((set, get) => ({
  ...initialState,
  setClientSecret: (clientSecret: File | null) => set({ clientSecret }),
  setRundown: (rundown: OntimeRundown | null) => set({ rundown }),
  setUserFields: (userFields: UserFields | null) => set({ userFields }),
  setWorksheet: (worksheet: string) => set({ worksheet }),
  setWorksheetOptions: (worksheetOptions: string[] | null) => set({ worksheetOptions }),
  patchExcelFileOptions: <T extends keyof ExcelImportMap>(field: T, value: ExcelImportMap[T]) => {
    const excelFileOptions = get().excelFileOptions;
    if (excelFileOptions[field] !== value) {
      excelFileOptions[field] = value;
    }
  },
  patchStepData: (patch: Partial<typeof initialStepData>) => {
    const stepData = get().stepData;
    set({ stepData: { ...stepData, ...patch } });
  },
  reset: () => set(initialState),
  resetPreview: () => set({ rundown: null, userFields: null }),
}));
