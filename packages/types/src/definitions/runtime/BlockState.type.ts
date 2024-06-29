import type { MaybeNumber } from '../../utils/utils.type.js';
import type { OntimeBlock } from '../core/OntimeEvent.type.js';

export type BlockState = {
  block: OntimeBlock | null;
  startedAt: MaybeNumber;
};
