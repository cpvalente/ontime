import type { MaybeNumber } from '../../utils/utils.type.js';
import type { EntryId } from '../core/OntimeEvent.type.js';

export type BlockState = {
  id: EntryId;
  startedAt: MaybeNumber;
};
