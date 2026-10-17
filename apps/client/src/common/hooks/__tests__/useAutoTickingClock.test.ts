// @vitest-environment happy-dom
import { runtimeStorePlaceholder } from 'ontime-types';
import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useClockSyncStore } from '../../stores/clockSync';
import { patchRuntime, runtimeStore } from '../../stores/runtime';
import { useAutoTickingClock } from '../useAutoTickingClock';

const serverStart = 12 * 60 * 60 * 1000;

describe('useAutoTickingClock', () => {
  let root: Root;
  let clock: number;

  function ClockReader() {
    clock = useAutoTickingClock();
    return null;
  }

  function advance(ms: number) {
    act(() => vi.advanceTimersByTime(ms));
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    runtimeStore.setState({ ...runtimeStorePlaceholder });
    useClockSyncStore.setState({ offset: null });
    root = createRoot(document.createElement('div'));
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows the server clock until synced', () => {
    act(() => root.render(createElement(ClockReader)));
    act(() => patchRuntime({ clock: serverStart }));
    advance(1500);
    expect(clock).toBe(serverStart);
  });

  it('counts locally from the offset, redrawing as each second starts', () => {
    act(() => root.render(createElement(ClockReader)));
    act(() => useClockSyncStore.setState({ offset: serverStart + 250 - performance.now() }));
    expect(clock).toBe(serverStart + 250);

    // the second changes 750ms later, we draw just after
    advance(750);
    expect(clock).toBe(serverStart + 250);
    advance(10);
    expect(clock).toBe(serverStart + 1010);

    advance(1000);
    expect(clock).toBe(serverStart + 2010);
  });
});
