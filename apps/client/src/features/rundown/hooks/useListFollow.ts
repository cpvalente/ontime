import { EntryId, MaybeString } from 'ontime-types';
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';

import { makeRevealLocation } from '../rundown.utils';
import { useEventSelection } from '../useEventSelection';
import { useUserScrolled } from './useUserScrolled';

type ListHandle = Pick<VirtuosoHandle, 'scrollToIndex' | 'scrollIntoView'>;

interface UseListFollowOptions {
  listRef: RefObject<ListHandle | null>;
  /** rendered ids, in list order */
  ids: EntryId[];
  liveId: MaybeString;
  isRunMode: boolean;
  /** room kept around a pinned or revealed row, in pixels */
  offset: number;
  behavior: 'smooth' | 'auto';
  /** while true, nothing scrolls (eg: during a drag) */
  blockedRef?: RefObject<boolean>;
  /** readies a reveal target, returns false while it is not renderable yet (eg: its group is expanding) */
  prepare?: (id: EntryId) => boolean;
}

/**
 * Decides when a rundown list scrolls, from user intent rather than data changes
 * - Run follows the live event, pinning it to the top through edits, until the user scrolls or navigates
 * - a new live event, entering Run or resume() follows again
 * - explicit navigation (the selection store's scrollToEntry) reveals the entry with the smallest scroll
 * - a keyboard move in Edit is followed by the entry's rendered position until the move settles
 * - pass scrollerRef to the virtuoso list
 */
export function useListFollow({
  listRef,
  ids,
  liveId,
  isRunMode,
  offset,
  behavior,
  blockedRef,
  prepare,
}: UseListFollowOptions) {
  const { userScrolledRef, scrollerRef } = useUserScrolled();
  const setScrollHandler = useEventSelection((state) => state.setScrollHandler);
  const [target, setTarget] = useState<EntryId | null>(null);
  const movedRef = useRef<{ id: EntryId; index: number; pending: number } | null>(null);
  const revealLocation = useMemo(() => makeRevealLocation(offset), [offset]);

  const pin = useCallback(() => {
    const index = liveId ? ids.indexOf(liveId) : -1;
    if (index !== -1 && !blockedRef?.current) {
      listRef.current?.scrollToIndex({ index, align: 'start', behavior, offset: -offset });
    }
  }, [ids, liveId, behavior, offset, listRef, blockedRef]);

  // navigating means the user took over from following
  const reveal = useCallback(
    (id: EntryId | null) => {
      if (!id || blockedRef?.current) {
        return;
      }
      userScrolledRef.current = true;
      movedRef.current = null;
      setTarget(id);
    },
    [blockedRef, userScrolledRef],
  );

  // explicit navigation (finder, keyboard) reveals through this list
  useEffect(() => {
    setScrollHandler(reveal);
    return () => setScrollHandler(null);
  }, [reveal, setScrollHandler]);

  const resume = useCallback(() => {
    userScrolledRef.current = false;
    setTarget(null);
    pin();
  }, [pin, userScrolledRef]);

  const followMove = useCallback(
    (id: EntryId | null, move: Promise<unknown>) => {
      if (isRunMode || !id) {
        return;
      }
      const moved = movedRef.current?.id === id ? movedRef.current : { id, index: ids.indexOf(id), pending: 0 };
      moved.pending += 1;
      movedRef.current = moved;
      userScrolledRef.current = false;
      move.finally(() => {
        moved.pending -= 1;
        if (moved.pending === 0 && movedRef.current === moved) {
          movedRef.current = null;
        }
      });
    },
    [ids, isRunMode, userScrolledRef],
  );

  // a new live event or entering Run follows again; content edits never end the user's take over
  useEffect(() => {
    if (isRunMode && liveId && !blockedRef?.current) {
      userScrolledRef.current = false;
    }
  }, [isRunMode, liveId, blockedRef, userScrolledRef]);

  // while following, keep the live event pinned as rows change
  useEffect(() => {
    if (isRunMode && !userScrolledRef.current) {
      pin();
    }
  }, [isRunMode, pin, userScrolledRef]);

  // a moved entry is revealed each time its rendered position changes
  useEffect(() => {
    const moved = movedRef.current;
    if (!moved) {
      return;
    }
    if (isRunMode || userScrolledRef.current) {
      movedRef.current = null;
      return;
    }
    const index = ids.indexOf(moved.id);
    if (index !== moved.index) {
      moved.index = index;
      setTarget(moved.id);
    }
  }, [ids, isRunMode, userScrolledRef]);

  // reveal a target once it is ready; a target which is not rendered is dropped
  useEffect(() => {
    if (!target || blockedRef?.current || (prepare && !prepare(target))) {
      return;
    }
    const index = ids.indexOf(target);
    if (index !== -1) {
      listRef.current?.scrollIntoView({ index, behavior, calculateViewLocation: revealLocation });
    }
    setTarget(null);
  }, [target, ids, prepare, behavior, revealLocation, listRef, blockedRef]);

  return { scrollerRef, reveal, resume, followMove };
}
