import { OntimeRundown } from '../../definitions/core/Rundown.type.js';

export interface GetRundownCached {
  rundown: OntimeRundown;
  revision: number;
}
