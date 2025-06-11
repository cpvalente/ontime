import { useEffect, useState, useRef, CSSProperties } from 'react';

interface UseListItemAnimationProps {
  onUnmount: () => void;
  duration?: number;
}

interface UseListItemAnimationReturn {
  itemRef: React.RefObject<HTMLDivElement>;
  itemStyle: CSSProperties;
}

export const useListItemAnimation = ({
  onUnmount,
  duration = 300,
}: UseListItemAnimationProps): UseListItemAnimationReturn => {
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [maxHeight, setMaxHeight] = useState<string | number>(0);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemRef.current) {
      setMaxHeight(itemRef.current.scrollHeight);
    }
    setIsMounted(true);

    return () => {
      setIsAnimatingOut(true);
      setMaxHeight(0);
      setTimeout(() => {
        onUnmount();
      }, duration);
    };
  }, [onUnmount, duration]);

  const itemStyle: CSSProperties = {
    maxHeight: isAnimatingOut ? 0 : maxHeight,
    opacity: isMounted && !isAnimatingOut ? 1 : 0,
  };

  return { itemRef, itemStyle };
};
