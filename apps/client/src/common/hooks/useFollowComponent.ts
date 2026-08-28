import { MaybeString } from 'ontime-types';
import { RefObject, useCallback, useEffect } from 'react';

function scrollToComponent<ComponentRef extends HTMLElement, ScrollRef extends HTMLElement>(
  componentRef: RefObject<ComponentRef | null>,
  scrollRef: RefObject<ScrollRef | null>,
  topOffset: number,
) {
  if (!componentRef.current || !scrollRef.current) {
    return;
  }

  const componentRect = componentRef.current.getBoundingClientRect();
  const scrollRect = scrollRef.current.getBoundingClientRect();
  const top = componentRect.top - scrollRect.top + scrollRef.current.scrollTop - topOffset;

  scrollRef.current.scrollTo({ top, behavior: 'smooth' });
}

type TopOffset = number | (() => number);

function resolveTopOffset(topOffset: TopOffset) {
  return typeof topOffset === 'function' ? topOffset() : topOffset;
}

interface UseFollowComponentProps {
  followRef: RefObject<HTMLElement | null>;
  scrollRef: RefObject<HTMLElement | null>;
  doFollow: boolean;
  topOffset?: TopOffset;
  setScrollFlag?: (newValue: boolean) => void;
  followTrigger?: MaybeString; // this would be an entry id or null
}

export default function useFollowComponent({
  followRef,
  scrollRef,
  doFollow,
  topOffset = 100,
  setScrollFlag,
  followTrigger,
}: UseFollowComponentProps) {
  // when trigger moves, view should follow
  useEffect(() => {
    if (!doFollow || !followTrigger) {
      return;
    }

    if (followRef.current && scrollRef.current) {
      setScrollFlag?.(true);
      // Use requestAnimationFrame to ensure the component is fully loaded
      window.requestAnimationFrame(() => {
        // resolve the offset after layout, so that measured values are up to date
        scrollToComponent(followRef, scrollRef, resolveTopOffset(topOffset));
        setScrollFlag?.(false);
      });
    }
  }, [followTrigger, doFollow, followRef, scrollRef, setScrollFlag, topOffset]);

  const scrollToRefComponent = useCallback(
    (componentRef = followRef, containerRef = scrollRef, offset?: number) => {
      if (componentRef && containerRef) {
        scrollToComponent(componentRef, containerRef, offset ?? resolveTopOffset(topOffset));
      }
    },
    [followRef, scrollRef, topOffset],
  );

  return scrollToRefComponent;
}
