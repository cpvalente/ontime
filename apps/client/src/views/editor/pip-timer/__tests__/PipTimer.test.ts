// @vitest-environment happy-dom
import { TimerType } from 'ontime-types';
import { MILLIS_PER_HOUR, createEvent } from 'ontime-utils';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { viewsSettingsPlaceholder } from '../../../../common/models/ViewSettings.type';
import { setMeasuredClockOffset } from '../../../../common/stores/clockStore';
import { runtimeStore } from '../../../../common/stores/runtime';
import { PipTimer } from '../PipTimer';

describe('PipTimer', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows the synchronised clock in clock mode, not the delayed published one', () => {
    runtimeStore.setState({ clock: 9 * MILLIS_PER_HOUR, eventNow: createEvent({ timerType: TimerType.Clock }) });
    setMeasuredClockOffset(10 * MILLIS_PER_HOUR - performance.now());

    act(() => root.render(createElement(PipTimer, { viewSettings: viewsSettingsPlaceholder })));

    expect(container.textContent).toContain('10:00:00');
    expect(container.textContent).not.toContain('09:00:00');
  });
});
