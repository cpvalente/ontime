import type { MaybeNumber } from '../../utils/utils.type';

export type ReportData = {
  startAt: MaybeNumber;
  endAt: MaybeNumber;
  overUnder: MaybeNumber;
};
export type OntimeReport = Record<string, ReportData>;
