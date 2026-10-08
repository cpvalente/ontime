import { describe, expect, it } from 'vitest';

import { patchRuntimeProperty, runtimeStore } from '../runtime';

describe('patchRuntimeProperty()', () => {
  it('preserves the previous snapshot when patching a property', () => {
    const initialState = runtimeStore.getState();
    runtimeStore.setState({ ping: 1 });
    const previous = runtimeStore.getState();
    let previousPing: number | undefined;
    const unsubscribe = runtimeStore.subscribe((_state, oldState) => {
      previousPing = oldState.ping;
    });

    try {
      patchRuntimeProperty('ping', 100);

      expect(previous.ping).toBe(1);
      expect(previousPing).toBe(1);
      expect(runtimeStore.getState().ping).toBe(100);
    } finally {
      unsubscribe();
      runtimeStore.setState(initialState, true);
    }
  });
});
