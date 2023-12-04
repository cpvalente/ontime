import { MutableRefObject, useCallback, useEffect } from 'react';

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
