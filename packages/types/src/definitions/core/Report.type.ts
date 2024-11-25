export type ReportData = {
  startAt: number | null;
  endAt: number | null;
  overUnder: number | null;
};
export type OntimeReport = Record<string, ReportData>;
