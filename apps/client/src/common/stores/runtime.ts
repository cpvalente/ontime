import isEqual from 'react-fast-compare';
import { RuntimeStore, runtimeStorePlaceholder } from 'ontime-types';
import { createWithEqualityFn, useStoreWithEqualityFn } from 'zustand/traditional';

const deepCompare = <T>(a: T, b: T) => isEqual(a, b);

export const runtimeStore = createWithEqualityFn<RuntimeStore>(
  () => ({
    ...runtimeStorePlaceholder,
  }),
  deepCompare,
);

export const useRuntimeStore = <T>(selector: (state: RuntimeStore) => T) =>
  useStoreWithEqualityFn(runtimeStore, selector, deepCompare);

let batchStore: Partial<RuntimeStore> = {};
let isUpdatePending: NodeJS.Timeout | null = null;

/**
 * Allows patching a property of the runtime store
 */
export function patchRuntimeProperty<K extends keyof RuntimeStore>(key: K, value: RuntimeStore[K]) {
  batchStore[key] = value;
  if (!isUpdatePending) {
    isUpdatePending = setTimeout(() => {
      const state = runtimeStore.getState();
      runtimeStore.setState({ ...state, ...batchStore });
      batchStore = {};
      isUpdatePending = null;
    });
  }
}

/**
 * Allows patching the entire runtime store
 */
export function patchRuntime(patch: Partial<RuntimeStore>) {
  const state = runtimeStore.getState();
  runtimeStore.setState({ ...state, ...patch });
}
