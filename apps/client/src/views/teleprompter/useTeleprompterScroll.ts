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
  /** where to rest while the transport points outside the rows shown */
  fallbackRow?: number;
}

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
    let lastFrame = performance.now();
    let frame = requestAnimationFrame(function loop(timestamp) {
      const { transport, layout, mode, rowHeight, fallbackRow } = latest.current;
      // a screen holds its place between an edit and the refetch of the script
      const target = positionAt(transport, layout, serverNow(), mode) ?? fallbackRow ?? lastTarget;
      lastTarget = target;

      // a screen which connects late lands straight on the line the others show
      shown = shown === null ? target : easeTowards(shown, target, frameDeltaSeconds(timestamp - lastFrame));
      lastFrame = timestamp;

      scroller.scrollTop = shown * rowHeight;
      frame = requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(frame);
  }, [scroller]);
}
