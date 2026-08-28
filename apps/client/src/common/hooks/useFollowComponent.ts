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

interface UseFollowComponentProps {
  followRef: RefObject<HTMLElement | null>;
  scrollRef: RefObject<HTMLElement | null>;
  doFollow: boolean;
  followTrigger: MaybeString; // this would be an entry id or null
  getTopOffset: () => number;
}

export default function useFollowComponent({
  followRef,
  scrollRef,
  doFollow,
  followTrigger,
  getTopOffset,
}: UseFollowComponentProps) {
  // when trigger moves, view should follow
  useEffect(() => {
    if (!doFollow || !followTrigger) {
      return;
    }

    if (followRef.current && scrollRef.current) {
      // Use requestAnimationFrame to ensure the component is fully loaded
      window.requestAnimationFrame(() => {
        // resolve the offset after layout, so that measured values are up to date
        scrollToComponent(followRef, scrollRef, getTopOffset());
      });
    }
  }, [followTrigger, doFollow, followRef, scrollRef, getTopOffset]);

  const scrollToRefComponent = useCallback(() => {
    scrollToComponent(followRef, scrollRef, getTopOffset());
  }, [followRef, scrollRef, getTopOffset]);

  return scrollToRefComponent;
}
