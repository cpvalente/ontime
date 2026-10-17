// @vitest-environment happy-dom
import { runtimeStorePlaceholder } from 'ontime-types';
import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { patchRuntime, runtimeStore } from '../../stores/runtime';
import { useAutoTickingClock } from '../useAutoTickingClock';

const serverStart = 12 * 60 * 60 * 1000;
const toSeconds = (ms: number) => Math.floor(ms / 1000);

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
    root = createRoot(document.createElement('div'));
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('waits for a value from the server before counting', () => {
    act(() => root.render(createElement(ClockReader)));
    advance(1500);
    expect(clock).toBe(0);

    act(() => patchRuntime({ clock: serverStart }));
    advance(1500);
    expect(toSeconds(clock)).toBe(toSeconds(serverStart + 1500));
  });

  it('stays frozen after reconnecting until fresh data arrives', () => {
    act(() => root.render(createElement(ClockReader)));
    act(() => patchRuntime({ clock: serverStart }));
    advance(1500);
    const frozen = clock;

    act(() => patchRuntime({ ping: -1 }));
    advance(5000);
    expect(clock).toBe(frozen);

    // the connection is back before the server sends the runtime data
    act(() => patchRuntime({ ping: 1 }));
    advance(1500);
    expect(clock).toBe(frozen);

    act(() => patchRuntime({ clock: serverStart + 8000 }));
    advance(1500);
    expect(toSeconds(clock)).toBe(toSeconds(serverStart + 9500));
  });
});
