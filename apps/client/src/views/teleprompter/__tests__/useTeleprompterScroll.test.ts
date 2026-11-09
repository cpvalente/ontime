// @vitest-environment happy-dom
import type { TeleprompterLine, TeleprompterSync } from 'ontime-types';
import { makeTeleprompterLayout } from 'ontime-utils';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { patchRuntime } from '../../../common/stores/runtime';
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
  const content = document.createElement('div');
  const onUserScroll = vi.fn<(row: number) => void>();
  let showSentScroll: (lines: number) => void;

  function Host({ sync, byHand }: { sync: TeleprompterSync; byHand: boolean }) {
    showSentScroll = useTeleprompterScroll({
      scroller: scroller as unknown as HTMLElement,
      content,
      sync,
      scriptLayout: layout,
      isBehind: false,
      layout,
      rowHeight,
      onUserScroll: byHand ? onUserScroll : undefined,
    });
    return null;
  }

  // the server publishes each sync to the runtime store, which the view reads it from
  const render = (sync: TeleprompterSync, byHand = true) =>
    act(async () => {
      patchRuntime({ teleprompterSync: sync });
      root.render(createElement(Host, { sync, byHand }));
    });
  /** where a screen which only follows moved its rows to */
  const contentOffset = () => content.style.transform;
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

  it('a screen the reader can scroll by hand follows a new position', async () => {
    await render(pausedAt(2));
    await frames(1);
    await render(pausedAt(2.2));
    await frames(1);
    expect(scroller.scrollTop).toBe(22);
  });

  it('moves the rows of a screen which only follows, rather than scroll it', async () => {
    await render(pausedAt(2.5), false);
    await frames(1);
    expect(contentOffset()).toBe('translate3d(0, -25px, 0)');
    expect(scroller.scrollTop).toBe(0);
  });

  it('shows a scroll sent to the server straight away, and nothing more once the server answers', async () => {
    await render(pausedAt(2), false);
    await frames(1);
    showSentScroll(0.3);
    await frames(1);
    expect(contentOffset()).toBe('translate3d(0, -23px, 0)');

    await render(pausedAt(2.3), false);
    await frames(2);
    expect(contentOffset()).toBe('translate3d(0, -23px, 0)');
  });

  it('trusts the server again when a scroll sent to it is not answered', async () => {
    await render(pausedAt(2), false);
    await frames(1);
    showSentScroll(0.3);
    await frames(1);
    expect(contentOffset()).toBe('translate3d(0, -23px, 0)');

    await frames(70);
    expect(contentOffset()).toBe('translate3d(0, -20px, 0)');
  });

  it('keeps showing the scrolls the server has not answered yet', async () => {
    await render(pausedAt(2), false);
    await frames(1);
    showSentScroll(0.5);
    showSentScroll(0.5);
    await frames(30);
    expect(contentOffset()).toBe('translate3d(0, -30px, 0)');

    await render(pausedAt(2.5), false);
    await frames(2);
    expect(contentOffset()).toBe('translate3d(0, -30px, 0)');
  });

  it('counts every answer when several arrive in one render', async () => {
    await render(pausedAt(2), false);
    await frames(1);
    showSentScroll(0.5);
    showSentScroll(0.5);
    await frames(30);
    expect(contentOffset()).toBe('translate3d(0, -30px, 0)');

    await act(async () => patchRuntime({ teleprompterSync: pausedAt(2.5) }));
    await render(pausedAt(3), false);
    await frames(2);
    expect(contentOffset()).toBe('translate3d(0, -30px, 0)');
  });
});
