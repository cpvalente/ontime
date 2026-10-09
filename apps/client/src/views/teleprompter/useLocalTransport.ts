import {
  type EntryId,
  runtimeStorePlaceholder,
  type TeleprompterAnchor,
  type TeleprompterScriptEvent,
  type TeleprompterState,
} from 'ontime-types';
import {
  applyTransportCommand,
  makeTeleprompterLayout,
  msUntilChange,
  reanchorTransport,
  settle,
  type TeleprompterTransportCommand,
} from 'ontime-utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { serverNow } from './serverClock';
import type { TeleprompterPayload } from './teleprompter.keymap';
import { toTransportCommand } from './teleprompter.utils';

interface UseLocalTransportArgs {
  events: TeleprompterScriptEvent[];
  cued: boolean;
  initialSpeed: number;
  loadedEventId: EntryId | null;
}

/** The same transport remote screens follow, held in the browser for a view of its own */
export function useLocalTransport({ events, cued, initialSpeed, loadedEventId }: UseLocalTransportArgs) {
  const layout = useMemo(() => makeTeleprompterLayout(events), [events]);
  const mode = useMemo(() => ({ cued }), [cued]);
  const [state, setState] = useState<TeleprompterState>(() => ({
    ...runtimeStorePlaceholder.teleprompter,
    speed: initialSpeed,
  }));

  const latest = useRef({ events, layout, mode, loadedEventId });
  // hands the latest values to the commands, which keep their identity
  useEffect(() => {
    latest.current = { events, layout, mode, loadedEventId };
  });

  const apply = useCallback((command: TeleprompterTransportCommand) => {
    const { layout, mode } = latest.current;
    if (command.type === 'goto' && !layout.events.some((event) => event.id === command.eventId)) return;
    setState((current) => applyTransportCommand(current, command, layout, serverNow(), mode));
  }, []);

  const handleCommand = useCallback(
    (payload: TeleprompterPayload) => {
      const command = toTransportCommand(payload, latest.current.loadedEventId);
      if (command) apply(command);
    },
    [apply],
  );

  /** Scrolling by hand moves the position, to a place the view found in the rows it shows */
  const moveToAnchor = useCallback((anchor: TeleprompterAnchor) => {
    const { layout, mode } = latest.current;
    setState((current) => {
      const now = serverNow();
      const settled = settle(current, layout, now, mode);
      return settle({ ...settled, anchor, since: now, stoppedAt: null }, layout, now, mode);
    });
  }, []);

  const shownEvents = useRef<TeleprompterScriptEvent[]>([]);
  // carries the reader over to a new script, which starts them at the top the first time
  useEffect(() => {
    const previous = shownEvents.current;
    shownEvents.current = events;
    setState((current) => reanchorTransport(current, previous, events, serverNow(), latest.current.mode));
  }, [events]);

  const playedMode = useRef(mode);
  // a new playback mode keeps the reader where they got to under the previous one
  useEffect(() => {
    const previousMode = playedMode.current;
    if (previousMode === mode) return;
    playedMode.current = mode;
    const { events } = latest.current;
    setState((current) => reanchorTransport(current, events, events, serverNow(), mode, previousMode));
  }, [mode]);

  const followedId = useRef<EntryId | null | undefined>(undefined);
  // cued, loading an event moves the reader to its start, also once its script arrives
  useEffect(() => {
    if (!cued || followedId.current === loadedEventId) return;
    if (loadedEventId && !layout.events.some((event) => event.id === loadedEventId)) return;
    followedId.current = loadedEventId;
    if (loadedEventId) apply({ type: 'goto', eventId: loadedEventId });
  }, [cued, loadedEventId, layout, apply]);

  const startSpeed = useRef(initialSpeed);
  // adopts a new starting speed from the view options, live changes in between are not saved
  useEffect(() => {
    if (startSpeed.current === initialSpeed) return;
    startSpeed.current = initialSpeed;
    apply({ type: 'speed', value: initialSpeed });
  }, [initialSpeed, apply]);

  // settles playback at its end, and keeps the event at the reading position current
  useEffect(() => {
    const delay = msUntilChange(state, layout, serverNow(), mode);
    if (delay === null) return;
    const timer = setTimeout(() => {
      setState((current) => {
        const settled = settle(current, layout, serverNow(), mode);
        // a timer capped short of the change wakes with nothing changed, a new state sets it again
        return settled === current ? { ...current } : settled;
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [state, layout, mode]);

  return { state, handleCommand, moveToAnchor };
}
