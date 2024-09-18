/**
 * Copied from
 * https://github.com/namhong2001/react-textfit/blob/master/index.tsx
 */

import { HTMLAttributes, PropsWithChildren, useCallback, useEffect, useRef } from 'react';

import { bsearch } from './fitText.utils';

interface FitTextProps extends HTMLAttributes<HTMLDivElement> {
  mode?: 'single' | 'multi';
  min?: number; // inclusive
  max?: number; // inclusive
}

export function FitText(props: PropsWithChildren<FitTextProps>) {
  const { children, mode = 'multi', min = 16, max = 256, ...elementProps } = props;
  const ref = useRef<HTMLDivElement>(null);

  const isOverflown = useCallback(() => {
    const el = ref.current;
    if (!el) return false;
    return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
  }, []);

  const setFontSize = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const originVisibility = el.style.visibility;

    el.style.visibility = 'hidden';
    const fontSize = bsearch(min, max + 1, (mid) => {
      el.style.fontSize = `${mid}px`;
      return !isOverflown();
    });
    el.style.fontSize = `${fontSize}px`;
    el.style.visibility = originVisibility;
  }, [isOverflown, min, max]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    setFontSize();
    const observer = new ResizeObserver(setFontSize);
    observer.observe(el);

    return () => observer.disconnect();
  }, [children, mode, setFontSize]);

  return (
    <div
      ref={ref}
      style={{
        whiteSpace: mode === 'single' ? 'nowrap' : 'normal',
      }}
      {...elementProps}
    >
      {children}
    </div>
  );
}
