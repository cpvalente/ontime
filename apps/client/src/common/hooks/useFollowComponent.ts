import { MutableRefObject, useCallback, useEffect, useRef } from 'react';

import { useSelectedEventId } from './useSocket';

function scrollToComponent<ComponentRef extends HTMLElement, ScrollRef extends HTMLElement>(
  componentRef: MutableRefObject<ComponentRef>,
  scrollRef: MutableRefObject<ScrollRef>,
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

function snapToComponent<ComponentRef extends HTMLElement, ScrollRef extends HTMLElement>(
  componentRef: MutableRefObject<ComponentRef>,
  scrollRef: MutableRefObject<ScrollRef>,
  topOffset: number,
) {
  if (!componentRef.current || !scrollRef.current) {
    return;
  }

  const componentRect = componentRef.current.getBoundingClientRect();
  const scrollRect = scrollRef.current.getBoundingClientRect();
  const top = componentRect.top - scrollRect.top + scrollRef.current.scrollTop - topOffset;

  // maintain current x scroll position
  scrollRef.current.scrollTo(scrollRef.current.scrollLeft, top);
}

interface UseFollowComponentProps {
  followRef: MutableRefObject<HTMLElement | null>;
  scrollRef: MutableRefObject<HTMLElement | null>;
  doFollow: boolean;
  topOffset?: number;
  setScrollFlag?: (newValue: boolean) => void;
}

export default function useFollowComponent(props: UseFollowComponentProps) {
  const { followRef, scrollRef, doFollow, topOffset = 100, setScrollFlag } = props;

  // when cursor moves, view should follow
  useEffect(() => {
    if (!doFollow) {
      return;
    }

    if (followRef.current && scrollRef.current) {
      setScrollFlag?.(true);
      // Use requestAnimationFrame to ensure the component is fully loaded
      window.requestAnimationFrame(() => {
        scrollToComponent(
          followRef as MutableRefObject<HTMLElement>,
          scrollRef as MutableRefObject<HTMLElement>,
          topOffset,
        );
        setScrollFlag?.(false);
      });
    }

    // eslint-disable-next-line -- the prompt seems incorrect
  }, [followRef?.current, scrollRef?.current]);

  const scrollToRefComponent = useCallback(
    (componentRef = followRef, containerRef = scrollRef, offset = topOffset) => {
      if (componentRef.current && containerRef.current) {
        // @ts-expect-error -- we know this are not null
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        scrollToComponent(componentRef!, scrollRef!, offset);
      }
    },
    [followRef, scrollRef, topOffset],
  );

  return scrollToRefComponent;
}

export function useFollowSelected(doFollow: boolean, topOffset = 100) {
  const selectedEvenId = useSelectedEventId();

  const selectedRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!doFollow) {
      return;
    }

    if (selectedEvenId && selectedRef.current && scrollRef.current) {
      // Use requestAnimationFrame to ensure the component is fully loaded
      window.requestAnimationFrame(() => {
        snapToComponent(
          { current: selectedRef.current } as MutableRefObject<HTMLElement>,
          { current: scrollRef.current } as MutableRefObject<HTMLElement>,
          topOffset,
        );
      });
    }
  }, [doFollow, selectedEvenId, topOffset]);

  return {
    selectedRef,
    scrollRef,
  };
}
