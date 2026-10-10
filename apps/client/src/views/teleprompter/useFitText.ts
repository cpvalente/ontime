import type { TeleprompterLine } from 'ontime-types';
import { useEffect, useState } from 'react';

/** Text size the width is measured at */
const referenceSize = 100;
const alphabet = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Sizes the text so the widest line of the script fits the text width
 * Lines break on the server, so a different font changes the size, never where lines break
 * A script of short lines is sized as if its lines held the characters per line
 */
export function useFitText(
  content: HTMLElement | null,
  lines: TeleprompterLine[],
  charsPerLine: number,
  textWidthPercent: number,
): number {
  const [fontSize, setFontSize] = useState(0);

  // measures the script against the width of the screen, again when either changes or web fonts load
  useEffect(() => {
    const container = content?.parentElement;
    if (!content || !container) return;
    let cancelled = false;

    const fit = () => {
      if (cancelled) return;
      const style = getComputedStyle(content);
      const context = document.createElement('canvas').getContext('2d');
      if (!context) return;
      context.font = `${style.fontStyle} ${style.fontWeight} ${referenceSize}px ${style.fontFamily}`;

      let widest = (context.measureText(alphabet).width / alphabet.length) * charsPerLine;
      for (const line of lines) {
        if (line.kind !== 'text') continue;
        widest = Math.max(widest, context.measureText(' '.repeat(line.indent ?? 0) + line.text).width);
      }

      const available = (container.clientWidth * textWidthPercent) / 100;
      setFontSize(widest > 0 ? (available * referenceSize) / widest : 0);
    };

    fit();
    void document.fonts?.ready.then(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [content, lines, charsPerLine, textWidthPercent]);

  return fontSize;
}
