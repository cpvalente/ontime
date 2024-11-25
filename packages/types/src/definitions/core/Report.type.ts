import type { MaybeNumber } from '../../utils/utils.type.js';

export type ReportData = {
  startAt: MaybeNumber;
  endAt: MaybeNumber;
  overUnder: MaybeNumber;
};
export type OntimeReport = Record<string, ReportData>;
