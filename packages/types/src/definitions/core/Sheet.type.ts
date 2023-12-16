export type Sheet = {
  worksheet: string | null;
  id: string | null;
};

export type SheetState = {
  secret: boolean;
  auth: boolean;
  id: boolean;
  worksheet: boolean;
  worksheetOptions: string[];
} | null;
