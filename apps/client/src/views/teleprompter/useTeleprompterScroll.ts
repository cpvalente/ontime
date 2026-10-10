import type { TeleprompterState } from 'ontime-types';
import { positionAt, type TeleprompterLayout, type TeleprompterMode } from 'ontime-utils';
import { useEffect, useRef } from 'react';

import { serverNow } from './serverClock';
import { easeTowards, frameDeltaSeconds } from './teleprompter.utils';

interface UseTeleprompterScrollArgs {
  scroller: HTMLElement | null;
  transport: TeleprompterState;
  layout: TeleprompterLayout;
  mode: TeleprompterMode;
  rowHeight: number;
  /** a screen which can be scrolled by hand reports where it was scrolled to */
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
    let lastScrollHeight = scroller.scrollHeight;
    // where the reader scrolled to, held until the transport they moved arrives
    let held: { row: number; transport: TeleprompterState } | null = null;
    let lastFrame = performance.now();

    let frame = requestAnimationFrame(function loop(timestamp) {
      const { transport, layout, mode, rowHeight, onUserScroll } = latest.current;
      const current = scroller.scrollTop;
      // the browser clamps the scroll position when the content gets shorter, which is not someone scrolling
      const isResized = scroller.scrollHeight !== lastScrollHeight;
      lastScrollHeight = scroller.scrollHeight;

      if (
        onUserScroll &&
        !isResized &&
        rowHeight > 0 &&
        lastWritten !== null &&
        Math.abs(current - lastWritten) > userScrollPx
      ) {
        held = { row: current / rowHeight, transport };
        shown = held.row;
        lastWritten = current;
        onUserScroll(held.row);
      }
      if (held && held.transport !== transport) held = null;

      // a screen holds its place between an edit and the refetch of the script
      const target = held?.row ?? positionAt(transport, layout, serverNow(), mode) ?? lastTarget;
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
