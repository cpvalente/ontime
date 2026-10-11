import type { TeleprompterSync } from 'ontime-types';
import { syncPositionAt, type TeleprompterLayout } from 'ontime-utils';
import { useEffect, useRef } from 'react';

import { serverNow } from './serverClock';
import { easeTowards, frameDeltaSeconds, rowInShown } from './teleprompter.utils';

interface UseTeleprompterScrollArgs {
  scroller: HTMLElement | null;
  /** where the transport reads from, in rows of the script: a new sync releases the place a reader scrolled to by hand */
  sync: TeleprompterSync;
  /** the rows of the whole script, which the sync counts */
  scriptLayout: TeleprompterLayout;
  /** the sync refers to a script the screen has not received yet, so the screen holds its place */
  isBehind: boolean;
  /** the rows the screen shows */
  layout: TeleprompterLayout;
  rowHeight: number;
  /** where to rest while the position is outside the rows shown */
  fallbackRow?: number;
  /** a screen which can be scrolled by hand reports the row it was scrolled to */
  onUserScroll?: (row: number) => void;
}

/** Below this, a difference in the scroll position is rounding rather than someone scrolling */
const userScrollPx = 2;

/**
 * Turns the transport into the scroll position, once per frame
 * The position is calculated from the transport and the clock, the page is never measured to find it
 */
export function useTeleprompterScroll(args: UseTeleprompterScrollArgs) {
  const latest = useRef(args);
  // hands the latest values to the frame loop, which runs for as long as the scroller exists
  useEffect(() => {
    latest.current = args;
  });

  const { scroller } = args;

  // the frame loop is the only writer of the scroll position
  useEffect(() => {
    if (!scroller) return;

    let shown: number | null = null;
    let lastTarget = 0;
    let lastWritten: number | null = null;
    // where the reader scrolled to, held until the position they moved arrives
    let held: { row: number; sync: TeleprompterSync } | null = null;
    let lastFrame = performance.now();

    let frame = requestAnimationFrame(function loop(timestamp) {
      const { sync, scriptLayout, isBehind, layout, rowHeight, fallbackRow, onUserScroll } = latest.current;
      const current = scroller.scrollTop;
      // a smaller window or fewer rows make the browser clamp the position last written, which nobody scrolled
      const isMoved = (written: number) => {
        const clamped = Math.min(written, Math.max(0, scroller.scrollHeight - scroller.clientHeight));
        return Math.abs(current - clamped) > userScrollPx;
      };

      if (onUserScroll && rowHeight > 0 && lastWritten !== null && isMoved(lastWritten)) {
        held = { row: current / rowHeight, sync };
        shown = held.row;
        lastWritten = current;
        onUserScroll(held.row);
      }
      if (held && held.sync !== sync) held = null;

      // a screen holds its place between an edit and the refetch of the script
      const reading = isBehind ? lastTarget : rowInShown(syncPositionAt(sync, serverNow()), scriptLayout, layout);
      const target = held?.row ?? reading ?? fallbackRow ?? lastTarget;
      lastTarget = target;

      // a screen which connects late lands straight on the line the others show
      shown = shown === null ? target : easeTowards(shown, target, frameDeltaSeconds(timestamp - lastFrame));
      lastFrame = timestamp;

      // writing the same position would stop a scroll the browser is animating
      const desired = shown * rowHeight;
      if (Math.abs(current - desired) > 0.5) {
        scroller.scrollTop = desired;
        lastWritten = scroller.scrollTop;
      } else {
        lastWritten = current;
      }

      frame = requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(frame);
  }, [scroller]);
}
