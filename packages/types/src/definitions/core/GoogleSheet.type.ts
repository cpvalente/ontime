export type GoogleSheet = {
  worksheet: string;
  id: string;
};

export type GoogleSheetState = {
  secret: boolean;
  auth: boolean;
  id: boolean;
  worksheet: boolean;
  worksheetOptions: string[];
};
