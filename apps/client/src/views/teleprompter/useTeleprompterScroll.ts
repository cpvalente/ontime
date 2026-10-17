import type { TeleprompterSync } from 'ontime-types';
import { syncPositionAt, type TeleprompterLayout } from 'ontime-utils';
import { useCallback, useEffect, useRef } from 'react';

import { serverNow } from './serverClock';
import { easeTowards, frameDeltaSeconds, rowInShown } from './teleprompter.utils';

interface UseTeleprompterScrollArgs {
  scroller: HTMLElement | null;
  /** the rows, which a screen that is not scrolled by hand moves rather than scroll */
  content: HTMLElement | null;
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
/** How long a scroll sent to the server is shown without an answer, after which the screen trusts the server again */
const sentScrollMs = 1000;

/**
 * Turns the transport into the scroll position, once per frame
 * The position is calculated from the transport and the clock, the page is never measured to find it
 * @returns a function which shows a scroll command sent to the server straight away, until the server answers it
 */
export function useTeleprompterScroll(args: UseTeleprompterScrollArgs) {
  const latest = useRef(args);
  // scroll commands sent and not answered: the server publishes one sync for every command, in order
  const sent = useRef({ lines: [] as number[], at: 0 });
  // hands the latest values to the frame loop, which runs for as long as the scroller exists
  // a new sync answers the oldest scroll together, so no frame counts a scroll twice
  // a sync from another source answers one too early, which the server's next sync puts right
  useEffect(() => {
    if (latest.current.sync !== args.sync) sent.current.lines.shift();
    latest.current = args;
  });

  const showSentScroll = useCallback((lines: number) => {
    sent.current.lines.push(lines);
    sent.current.at = performance.now();
  }, []);

  const { scroller, content } = args;

  // the frame loop is the only writer of the scroll position
  useEffect(() => {
    if (!scroller || !content) return;

    let shown: number | null = null;
    let lastTarget = 0;
    // where the loop put the rows, or where the reader left them, which a hand scroll is measured from
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
      const current = onUserScroll ? scroller.scrollTop : 0;

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

      const pending = sent.current;
      if (pending.lines.length > 0 && timestamp - pending.at > sentScrollMs) pending.lines = [];

      // a screen holds its place between an edit and the refetch of the script
      const reading = isBehind
        ? lastTarget
        : rowInShown(sentPositionAt(sync, scriptLayout, pending.lines), scriptLayout, layout);
      const target = held?.row ?? reading ?? fallbackRow ?? lastTarget;
      lastTarget = target;

      // a screen which connects late lands straight on the line the others show
      shown = shown === null ? target : easeTowards(shown, target, frameDeltaSeconds(timestamp - lastFrame));
      lastFrame = timestamp;

      const desired = shown * rowHeight;
      if (!onUserScroll) {
        // a screen which only follows moves its rows on the compositor, smoothly between whole pixels
        if (desired !== lastWritten) {
          content.style.transform = `translate3d(0, ${-desired}px, 0)`;
          lastWritten = desired;
        }
      } else if (Math.abs(lastWritten - desired) > 0.5 || Math.abs(current - desired) > userScrollPx) {
        // writes when the position moved or the browser clamped it, never to undo a hand scroll too small to count
        scroller.scrollTop = desired;
        lastWritten = scroller.scrollTop;
      }

      frame = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(commit);
      content.style.transform = '';
    };
  }, [scroller, content]);

  return showSentScroll;
}

/** The reading position with the scrolls the server has not answered, which it keeps within the script */
function sentPositionAt(sync: TeleprompterSync, scriptLayout: TeleprompterLayout, sentLines: number[]): number {
  const position = syncPositionAt(sync, serverNow());
  if (sentLines.length === 0) return position;
  const lastRow = scriptLayout.events.at(-1)?.endRow ?? 0;
  const ahead = sentLines.reduce((total, lines) => total + lines, 0);
  return Math.min(Math.max(position + ahead, 0), lastRow);
}
