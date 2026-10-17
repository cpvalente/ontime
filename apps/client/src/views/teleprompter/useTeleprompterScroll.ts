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
/** How long a hand scroll rests before it moves the position, so a scroll renders the view once rather than every frame */
const userScrollCommitMs = 150;

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
    // where the loop put the scroller, or where the reader left it, which a hand scroll is measured from
    let lastWritten = scroller.scrollTop;
    // where the reader scrolled to, held until the position they moved arrives
    let held: { row: number; sync: TeleprompterSync } | null = null;
    let commit: ReturnType<typeof setTimeout> | undefined;
    let lastFrame = performance.now();

    const commitHeld = () => {
      commit = undefined;
      if (!held) return;
      // the sync which the commit replaces releases the held row
      held.sync = latest.current.sync;
      latest.current.onUserScroll?.(held.row);
    };

    let frame = requestAnimationFrame(function loop(timestamp) {
      const { sync, scriptLayout, isBehind, layout, rowHeight, fallbackRow, onUserScroll } = latest.current;
      const current = scroller.scrollTop;

      if (onUserScroll && rowHeight > 0) {
        // a smaller window or fewer rows make the browser clamp the position last written, which nobody scrolled
        const clamped = Math.min(lastWritten, Math.max(0, scroller.scrollHeight - scroller.clientHeight));
        if (Math.abs(current - clamped) > userScrollPx) {
          held = { row: current / rowHeight, sync };
          shown = held.row;
          lastWritten = current;
          clearTimeout(commit);
          commit = setTimeout(commitHeld, userScrollCommitMs);
        }
      }
      // a command while the reader is still scrolling does not release them
      if (held && commit === undefined && held.sync !== sync) held = null;

      // a screen holds its place between an edit and the refetch of the script
      const reading = isBehind ? lastTarget : rowInShown(syncPositionAt(sync, serverNow()), scriptLayout, layout);
      const target = held?.row ?? reading ?? fallbackRow ?? lastTarget;
      lastTarget = target;

      // a screen which connects late lands straight on the line the others show
      shown = shown === null ? target : easeTowards(shown, target, frameDeltaSeconds(timestamp - lastFrame));
      lastFrame = timestamp;

      // writes when the position moved or the browser clamped it, never to undo a hand scroll too small to count
      const desired = shown * rowHeight;
      if (Math.abs(lastWritten - desired) > 0.5 || Math.abs(current - desired) > userScrollPx) {
        scroller.scrollTop = desired;
        lastWritten = scroller.scrollTop;
      }

      frame = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(commit);
    };
  }, [scroller]);
}
