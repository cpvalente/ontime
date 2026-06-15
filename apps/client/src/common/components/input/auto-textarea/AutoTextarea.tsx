// @ts-expect-error no types from library
import autosize from 'autosize/dist/autosize';
import { FocusEvent, RefObject, useCallback, useEffect } from 'react';

import { timeSync } from '../../../devtools/cuesheet-metrics/usePerfMark'; // PERF-METRICS
import Textarea, { type TextareaProps } from '../textarea/Textarea';

interface AutoTextAreaProps extends TextareaProps {
  inputref: RefObject<HTMLTextAreaElement | null>;
}

/**
 * A textarea that automatically resizes based on its content.
 *
 * `autosize()` forces a synchronous reflow (reads scrollHeight) and installs a MutationObserver.
 * Doing that on mount makes it expensive when many of these are mounted at once (e.g. virtualised
 * table rows during scroll), so we only attach autosize while the field is focused for editing and
 * keep it in sync with the value during that time.
 */
export function AutoTextarea({ value, inputref, onFocus, onBlur, ...textAreaProps }: AutoTextAreaProps) {
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLTextAreaElement>) => {
      timeSync('cell.autosize', () => autosize(inputref.current)); // PERF-METRICS
      onFocus?.(event);
    },
    [inputref, onFocus],
  );

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLTextAreaElement>) => {
      if (inputref.current) {
        autosize.destroy(inputref.current);
      }
      onBlur?.(event);
    },
    [inputref, onBlur],
  );

  // while focused, keep the height in sync as the value changes
  useEffect(() => {
    const node = inputref.current;
    if (node && document.activeElement === node) {
      autosize(node);
    }
  }, [inputref, value]);

  return (
    <Textarea ref={inputref} value={value} onFocus={handleFocus} onBlur={handleBlur} {...textAreaProps} />
  );
}
