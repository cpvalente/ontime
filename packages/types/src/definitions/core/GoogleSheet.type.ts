export type GoogleSheet = {
  worksheet: string | null;
  id: string | null;
};

export type GoogleSheetState = {
  secret: boolean;
  auth: boolean;
  id: boolean;
  worksheet: boolean;
  worksheetOptions: string[];
} | null;
