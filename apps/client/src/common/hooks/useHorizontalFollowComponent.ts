import { RefObject, useCallback, useEffect } from 'react';
import { EntryId } from 'ontime-types';

function scrollToComponent<ComponentRef extends HTMLElement, ScrollRef extends HTMLElement>(
  componentRef: RefObject<ComponentRef> | null,
  scrollRef: RefObject<ScrollRef>,
  leftOffset: number,
) {
  if (!scrollRef.current) {
    return;
  }

  if (!componentRef?.current) {
    // If no target component, scroll to start
    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    return;
  }

  const componentRect = componentRef.current.getBoundingClientRect();
  const scrollRect = scrollRef.current.getBoundingClientRect();
  const left = componentRect.left - scrollRect.left + scrollRef.current.scrollLeft - leftOffset;

  scrollRef.current.scrollTo({ left, behavior: 'smooth' });
}

interface UseHorizontalFollowComponentOptions {
  followRef: RefObject<HTMLElement | null>;
  scrollRef: RefObject<HTMLElement | null>;
  doFollow: boolean;
  selectedEventId: EntryId | null;
  leftOffset?: number;
  setScrollFlag?: (newValue: boolean) => void;
}

/**
 * This is a copy of useFollowComponent, but for horizontal scrolling
 * Designed with the timeline component in mind
 */
export default function useHorizontalFollowComponent({
  followRef,
  scrollRef,
  doFollow,
  selectedEventId,
  leftOffset = 0,
  setScrollFlag,
}: UseHorizontalFollowComponentOptions) {
  useEffect(() => {
    if (!doFollow || !scrollRef.current) {
      return;
    }

    setScrollFlag?.(true);
    // Use requestAnimationFrame to ensure the component is fully loaded
    window.requestAnimationFrame(() => {
      scrollToComponent(
        selectedEventId !== null ? (followRef as RefObject<HTMLElement>) : null,
        scrollRef as RefObject<HTMLElement>,
        leftOffset,
      );
      setScrollFlag?.(false);
    });
  }, [followRef, scrollRef, doFollow, leftOffset, setScrollFlag, selectedEventId]);

  const scrollToRefComponent = useCallback(
    (componentRef = followRef, containerRef = scrollRef, offset = leftOffset) => {
      if (containerRef.current) {
        scrollToComponent(
          selectedEventId !== null ? (componentRef as RefObject<HTMLElement>) : null,
          containerRef as RefObject<HTMLElement>,
          offset,
        );
      }
    },
    [followRef, scrollRef, leftOffset, selectedEventId],
  );

  return scrollToRefComponent;
}
