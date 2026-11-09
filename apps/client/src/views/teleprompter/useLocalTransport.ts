import type {
  EntryId,
  TeleprompterAnchor,
  TeleprompterMode,
  TeleprompterScriptEvent,
  TeleprompterTransport,
} from 'ontime-types';
import {
  applyTransportCommand,
  describeSync,
  describeTransport,
  makeTeleprompterLayout,
  reanchorTransport,
  rowOfAnchor,
  settle,
  type TeleprompterTransportCommand,
} from 'ontime-utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { serverNow } from './serverClock';
import type { TeleprompterViewCommand } from './teleprompter.keymap';

interface UseLocalTransportArgs {
  events: TeleprompterScriptEvent[];
  initialMode: TeleprompterMode;
  initialSpeed: number;
  loadedEventId: EntryId | null;
}

const noEvents: TeleprompterScriptEvent[] = [];
const emptyScript = { events: noEvents, layout: makeTeleprompterLayout(noEvents) };

/** How often playback settles at its end and checks the event being read, as the server does with its clock */
const tickMs = 1000;

/**
 * The same transport the controllers drive, held in the browser for a view of its own
 * @returns the transport, the sync the view animates from, as the server describes it for its screens,
 * and the teleprompter it describes, which the view shows
 */
export function useLocalTransport({ events, initialMode, initialSpeed, loadedEventId }: UseLocalTransportArgs) {
  const layout = useMemo(() => makeTeleprompterLayout(events), [events]);
  const [transport, setTransport] = useState<TeleprompterTransport>(() => ({
    playback: 'pause',
    mode: initialMode,
    speed: initialSpeed,
    anchor: null,
    at: 0,
    ended: null,
  }));
  // reading on into another event renders again, to describe the event being read
  const [, setReaderId] = useState<EntryId | null>(null);
  const state = describeTransport(transport, layout, serverNow());
  // screens only compare revisions with the shared transport, a view holding its own knows when it is behind
  const sync = useMemo(() => describeSync(transport, layout, 0), [transport, layout]);
  // until the transport is carried over to new events, its anchor may not be in them, and the view holds its place
  const isBehind = transport.anchor !== null && rowOfAnchor(layout, transport.anchor) === null;

  const latest = useRef({ layout, loadedEventId, transport });
  // hands the latest values to the commands, which keep their identity
  useEffect(() => {
    latest.current = { layout, loadedEventId, transport };
  });

  const apply = useCallback((command: TeleprompterTransportCommand) => {
    const { layout } = latest.current;
    if (command.type === 'goto' && !layout.events.some((event) => event.id === command.eventId)) return;
    setTransport((current) => applyTransportCommand(current, command, layout, serverNow()));
  }, []);

  const handleCommand = useCallback(
    (command: TeleprompterViewCommand) => {
      if (command.type !== 'goto') return apply(command);
      // going back to the loaded event does nothing while nothing is loaded
      const { loadedEventId } = latest.current;
      if (loadedEventId) apply({ type: 'goto', eventId: loadedEventId });
    },
    [apply],
  );

  /** Scrolling by hand moves the position, to a place the view found in the rows it shows */
  const moveToAnchor = useCallback((anchor: TeleprompterAnchor) => {
    const { layout } = latest.current;
    setTransport((current) => {
      const now = serverNow();
      const settled = settle(current, layout, now);
      return settle({ ...settled, anchor, at: now, ended: null }, layout, now);
    });
  }, []);

  const shownScript = useRef(emptyScript);
  // carries the reader over to a new script, which starts them at the top the first time
  // declared before the starting mode, so a script and a mode which change together apply in that order
  useEffect(() => {
    const previous = shownScript.current;
    if (previous.events === events) return;
    const next = { events, layout };
    shownScript.current = next;
    const now = serverNow();
    setTransport((current) => reanchorTransport(current, previous, next, now));
  }, [events, layout]);

  const startMode = useRef(initialMode);
  // adopts a new starting mode from the view options, live changes in between are not saved
  useEffect(() => {
    if (startMode.current === initialMode) return;
    startMode.current = initialMode;
    apply({ type: 'mode', mode: initialMode });
  }, [initialMode, apply]);

  const isEventByEvent = transport.mode === 'event';
  const followedId = useRef<EntryId | null | undefined>(undefined);
  // event by event, loading an event moves the reader to its start, also once its script arrives
  useEffect(() => {
    if (!isEventByEvent || followedId.current === loadedEventId) return;
    if (loadedEventId && !layout.events.some((event) => event.id === loadedEventId)) return;
    followedId.current = loadedEventId;
    if (loadedEventId) apply({ type: 'goto', eventId: loadedEventId });
  }, [isEventByEvent, loadedEventId, layout, apply]);

  const startSpeed = useRef(initialSpeed);
  // adopts a new starting speed from the view options, live changes in between are not saved
  useEffect(() => {
    if (startSpeed.current === initialSpeed) return;
    startSpeed.current = initialSpeed;
    apply({ type: 'speed', value: initialSpeed });
  }, [initialSpeed, apply]);

  const isPlaying = transport.playback === 'play';
  // while playing, settles playback at its end and follows the reader into other events, once a second
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      const { layout, transport } = latest.current;
      const now = serverNow();
      setTransport((current) => settle(current, layout, now));
      setReaderId(describeTransport(transport, layout, now).event?.id ?? null);
    }, tickMs);
    return () => clearInterval(timer);
  }, [isPlaying]);

  return { transport, layout, sync, isBehind, state, handleCommand, moveToAnchor };
}
