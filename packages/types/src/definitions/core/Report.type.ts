import type { MaybeNumber } from '../../utils/utils.type.js';

export type OntimeEventReport = {
  startedAt: MaybeNumber;
  endedAt: MaybeNumber;
};

export type OntimeReport = Record<string, OntimeEventReport>;
