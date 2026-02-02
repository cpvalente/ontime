import { RuntimeStore, runtimeStorePlaceholder } from 'ontime-types';
import { deepmerge } from 'ontime-utils';

const baseStore: RuntimeStore = {
  ...runtimeStorePlaceholder
};

export function makeRuntimeStoreData(patch?: Partial<RuntimeStore>): RuntimeStore {
  return deepmerge(baseStore, patch) as RuntimeStore;
}
