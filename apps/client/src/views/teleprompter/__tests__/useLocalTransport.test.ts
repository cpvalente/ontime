// @vitest-environment happy-dom
import type { TeleprompterLine, TeleprompterMode, TeleprompterScriptEvent } from 'ontime-types';
import { syncPositionAt } from 'ontime-utils';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLocalTransport } from '../useLocalTransport';

let now = 0;
vi.mock('../serverClock', () => ({ serverNow: () => now }));

/** An event with a heading, some lines of text 10 characters apart, and a blank line */
function makeEvent(id: string, textLines: number): TeleprompterScriptEvent {
  const lines: TeleprompterLine[] = [{ kind: 'heading', text: id }];
  for (let i = 0; i < textLines; i++) {
    lines.push({ kind: 'text', text: `${id} line ${i}`, start: i * 10 });
  }
  lines.push({ kind: 'blank' });
  return { id, cue: id.toUpperCase(), title: id, lines };
}

type Transport = ReturnType<typeof useLocalTransport>;

describe('useLocalTransport()', () => {
  let root: Root;
  let transport: Transport;

  function Host(props: {
    events: TeleprompterScriptEvent[];
    revision: number;
    mode: TeleprompterMode;
    loadedEventId: string | null;
  }) {
    const { mode, ...rest } = props;
    transport = useLocalTransport({ ...rest, initialMode: mode, initialSpeed: 30 });
    return null;
  }

  const render = (
    events: TeleprompterScriptEvent[],
    mode: TeleprompterMode,
    loadedEventId: string | null = null,
    revision = 1,
  ) => act(async () => root.render(createElement(Host, { events, revision, mode, loadedEventId })));

  /** the row the view reads from, out of the sync it describes for itself as the server does for its screens */
  const readingRow = () => syncPositionAt(transport.sync, now);

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.useFakeTimers();
    now = 0;
    root = createRoot(document.createElement('div'));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps a playing reader in place when the script and the playback mode change together', async () => {
    // a: heading 0, text 1-2, blank 3 | b: heading 4, text 5-7, blank 8 | c: heading 9, text 10, blank 11
    const events = [makeEvent('a', 2), makeEvent('b', 3), makeEvent('c', 1)];
    await render(events, 'script');
    await act(async () => transport.handleCommand({ type: 'play' }));

    // reading the whole script at 30 lines per minute from the start of a has moved into b
    now = 10_000;
    expect(readingRow()).toBe(6);

    // an edit after the reader, and the event by event mode, arrive in the same render
    const edited = [makeEvent('a', 2), makeEvent('b', 3), makeEvent('c', 2)];
    await render(edited, 'event', null, 2);

    expect(transport.transport).toMatchObject({ playback: 'play', mode: 'event' });
    expect(transport.sync).toMatchObject({ revision: 2, playback: 'play' });
    expect(transport.isBehind).toBe(false);
    expect(readingRow()).toBe(6);
  });

  it('settles playback at the end of the event on the next tick of the clock', async () => {
    // a: heading 0, text 1-2, blank 3 | b: heading 4, text 5-7, blank 8
    const events = [makeEvent('a', 2), makeEvent('b', 3)];
    await render(events, 'event');
    await act(async () => transport.handleCommand({ type: 'play' }));

    // the text of a ends 2 rows on, 4 seconds at 30 lines per minute
    now = 3000;
    await act(async () => vi.advanceTimersByTime(3000));
    expect(transport.state).toMatchObject({ playback: 'play', ended: null });

    now = 4500;
    await act(async () => vi.advanceTimersByTime(1000));
    expect(transport.state).toMatchObject({ playback: 'pause', ended: 'event' });
    expect(readingRow()).toBe(3);
  });

  it('goes back to the loaded event, and does nothing while nothing is loaded', async () => {
    const events = [makeEvent('a', 2), makeEvent('b', 3)];
    await render(events, 'script');
    const atTop = transport.transport;
    await act(async () => transport.handleCommand({ type: 'goto', target: 'loaded' }));
    expect(transport.transport).toBe(atTop);

    await render(events, 'script', 'b');
    await act(async () => transport.handleCommand({ type: 'goto', target: 'loaded' }));
    expect(transport.transport.anchor).toEqual({ eventId: 'b', charOffset: 0, lines: 0 });
    expect(transport.state.event).toMatchObject({ id: 'b', cue: 'B' });
  });
});
