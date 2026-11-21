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
  /** also caps the font size to this share of the element's width, to match text sized in viewport or container units */
  maxRatio?: number;
}

export function FitText({
  children,
  mode = 'multi',
  min = 16,
  max = 256,
  maxRatio,
  ...elementProps
}: PropsWithChildren<FitTextProps>) {
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
    const ceiling = maxRatio ? Math.max(min, Math.min(max, Math.floor(el.clientWidth * maxRatio))) : max;
    const fontSize = bsearch(min, ceiling + 1, (mid) => {
      el.style.fontSize = `${mid}px`;
      return !isOverflown();
    });
    el.style.fontSize = `${fontSize}px`;
    el.style.visibility = originVisibility;
  }, [isOverflown, min, max, maxRatio]);

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
