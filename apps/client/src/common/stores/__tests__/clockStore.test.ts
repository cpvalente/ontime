// @vitest-environment happy-dom
import { dayInMs } from 'ontime-utils';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let useAutoTickingClock: typeof import('../clockStore').useAutoTickingClock;
let setPublishedClock: typeof import('../clockStore').setPublishedClock;
let setMeasuredClockOffset: typeof import('../clockStore').setMeasuredClockOffset;

function Clock() {
  return createElement('span', null, String(useAutoTickingClock()));
}

describe('clockStore', () => {
  let root: Root;
  let container: HTMLDivElement;
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    // the browser is on UTC
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(0);
    vi.resetModules();
    ({ useAutoTickingClock, setPublishedClock, setMeasuredClockOffset } = await import('../clockStore'));
    setPublishedClock(10000);
    container = document.createElement('div');
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps the published clock ticking if updates stop before the first Pong', async () => {
    await act(async () => root.render(createElement(Clock)));
    await act(async () => vi.advanceTimersByTime(3000));

    expect(container.textContent).toBe('13000');
  });

  it('ignores a published clock which is not a number', async () => {
    await act(async () => root.render(createElement(Clock)));
    await act(async () => setPublishedClock(Number.NaN));
    await act(async () => vi.advanceTimersByTime(1000));

    expect(container.textContent).toBe('11000');
    expect(vi.getTimerCount()).toBe(1);
  });

  it('anchors the fallback to the latest published clock', async () => {
    await act(async () => root.render(createElement(Clock)));
    await act(async () => vi.advanceTimersByTime(500));
    await act(async () => setPublishedClock(12500));
    await act(async () => vi.advanceTimersByTime(500));

    expect(container.textContent).toBe('13000');
  });

  it('ignores published clocks after the first Pong', async () => {
    await act(async () => root.render(createElement(Clock)));
    await act(async () => setMeasuredClockOffset(20000));
    await act(async () => setPublishedClock(5000));

    expect(container.textContent).toBe('20000');
  });

  it('shows the measured epoch in the browser timezone', async () => {
    vi.mocked(Date.prototype.getTimezoneOffset).mockReturnValue(-60);
    await act(async () => root.render(createElement(Clock)));
    await act(async () => setMeasuredClockOffset(20000));

    expect(container.textContent).toBe(String(20000 + 3600000));
  });

  it('follows a browser daylight saving change on the next tick', async () => {
    await act(async () => root.render(createElement(Clock)));
    await act(async () => setMeasuredClockOffset(20000));
    vi.mocked(Date.prototype.getTimezoneOffset).mockReturnValue(-60);
    await act(async () => vi.advanceTimersByTime(1000));

    expect(container.textContent).toBe(String(21000 + 3600000));
  });

  it('reads daylight saving at the server time, not the browser date', async () => {
    // summer for instants before day 300, eg: the server time, winter after, eg: the browser date
    const summerEnd = 300 * dayInMs;
    vi.mocked(Date.prototype.getTimezoneOffset).mockImplementation(function (this: Date) {
      return this.getTime() < summerEnd ? -120 : -60;
    });
    await act(async () => root.render(createElement(Clock)));
    await act(async () => setMeasuredClockOffset(200 * dayInMs + 20000 - performance.now()));

    expect(container.textContent).toBe(String(20000 + 7200000));
  });

  it('does not report a published clock in another timezone as a disagreement', () => {
    setMeasuredClockOffset(20000);

    expect(setPublishedClock(20000 + performance.now() + 3600000)).toBe(false);
    expect(setPublishedClock(20000 + performance.now() - 5.75 * 3600000)).toBe(false);
  });

  it('reports a published clock which disagrees with the measured one by more than its delay', () => {
    setMeasuredClockOffset(20000);

    expect(setPublishedClock(20000 + performance.now() - 1500)).toBe(false);
    expect(setPublishedClock(20000 + performance.now() + 5000)).toBe(true);
  });

  it('shares one ticking schedule which keeps advancing while no readers are mounted', async () => {
    await act(async () => root.render([createElement(Clock, { key: 'a' }), createElement(Clock, { key: 'b' })]));
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => root.render(null));
    await act(async () => vi.advanceTimersByTime(2000));
    await act(async () => root.render(createElement(Clock)));
    expect(container.textContent).toBe('12000');
  });
});
