import type { MaybeNumber } from '../../utils/utils.type.js';
import type { OntimeBlock } from '../core/OntimeEvent.type.js';

export type CurrentBlockState = {
  block: OntimeBlock | null;
  startedAt: MaybeNumber;
};
