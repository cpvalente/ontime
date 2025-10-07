import { RefObject, useCallback, useEffect } from 'react';
import { MaybeString } from 'ontime-types';

function scrollToComponent<ComponentRef extends HTMLElement, ScrollRef extends HTMLElement>(
  componentRef: RefObject<ComponentRef>,
  scrollRef: RefObject<ScrollRef>,
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
  topOffset?: number;
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
        scrollToComponent(followRef as RefObject<HTMLElement>, scrollRef as RefObject<HTMLElement>, topOffset);
        setScrollFlag?.(false);
      });
    }
  }, [followTrigger, doFollow, followRef, scrollRef, setScrollFlag, topOffset]);

  const scrollToRefComponent = useCallback(
    (componentRef = followRef, containerRef = scrollRef, offset = topOffset) => {
      if (componentRef && containerRef) {
        // @ts-expect-error -- we know this are not null
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        scrollToComponent(componentRef!, containerRef!, offset);
      }
    },
    [followRef, scrollRef, topOffset],
  );

  return scrollToRefComponent;
}
