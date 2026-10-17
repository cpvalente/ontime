// @vitest-environment happy-dom
import type { TeleprompterLine, TeleprompterSync } from 'ontime-types';
import { makeTeleprompterLayout } from 'ontime-utils';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTeleprompterScroll } from '../useTeleprompterScroll';

vi.mock('../serverClock', () => ({ serverNow: () => 0 }));

const rowHeight = 10;
const lines: TeleprompterLine[] = Array.from({ length: 20 }, (_, i) => ({
  kind: 'text',
  text: `line ${i}`,
  start: i * 10,
}));
const layout = makeTeleprompterLayout([{ id: 'a', cue: 'A', title: 'a', lines }]);

const pausedAt = (row: number): TeleprompterSync => ({
  revision: 1,
  playback: 'pause',
  speed: 30,
  row,
  until: row,
  at: 0,
});

describe('useTeleprompterScroll()', () => {
  let root: Root;
  const scroller = { scrollTop: 0, scrollHeight: 1000, clientHeight: 100 };
  const onUserScroll = vi.fn();

  function Host({ sync }: { sync: TeleprompterSync }) {
    useTeleprompterScroll({
      scroller: scroller as unknown as HTMLElement,
      sync,
      scriptLayout: layout,
      isBehind: false,
      layout,
      rowHeight,
      onUserScroll,
    });
    return null;
  }

  const render = (sync: TeleprompterSync) => act(async () => root.render(createElement(Host, { sync })));
  const frames = (count: number) => act(async () => vi.advanceTimersByTime(count * 16));

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    });
    scroller.scrollTop = 0;
    onUserScroll.mockClear();
    root = createRoot(document.createElement('div'));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('moves the position once a hand scroll rests, and never pulls the reader back', async () => {
    await render(pausedAt(2));
    await frames(1);
    expect(scroller.scrollTop).toBe(20);

    // a scroll over several frames
    for (const position of [40, 60, 80]) {
      scroller.scrollTop = position;
      await frames(1);
      expect(scroller.scrollTop).toBe(position);
    }
    // a move too small to count is left alone
    scroller.scrollTop = 81;
    await frames(2);
    expect(scroller.scrollTop).toBe(81);
    expect(onUserScroll).not.toHaveBeenCalled();

    await frames(10);
    expect(onUserScroll).toHaveBeenCalledTimes(1);
    expect(onUserScroll).toHaveBeenCalledWith(8);

    // the position the scroll moved arrives, which the screen already shows
    await render(pausedAt(8));
    await frames(5);
    expect(scroller.scrollTop).toBe(81);
  });

  it('follows a new position once the reader is not scrolling', async () => {
    await render(pausedAt(2));
    await frames(1);
    await render(pausedAt(2.2));
    await frames(1);
    expect(scroller.scrollTop).toBe(22);
  });
});
