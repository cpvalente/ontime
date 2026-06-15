// @ts-expect-error no types from library
import autosize from 'autosize/dist/autosize';
import { RefObject, useEffect } from 'react';

import { timeSync } from '../../../devtools/cuesheet-metrics/usePerfMark'; // PERF-METRICS
import Textarea, { type TextareaProps } from '../textarea/Textarea';

interface AutoTextAreaProps extends TextareaProps {
  inputref: RefObject<HTMLTextAreaElement | null>;
}

/**
 * A textarea that automatically resizes based on its content
 */
export function AutoTextarea({ value, inputref, ...textAreaProps }: AutoTextAreaProps) {
  // when the value changes, we use the ref to reapply autosize
  useEffect(() => {
    const node = inputref.current;
    timeSync('cell.autosize', () => autosize(inputref.current)); // PERF-METRICS

    return () => {
      autosize.destroy(node);
    };
  }, [inputref, value]);

  return <Textarea ref={inputref} value={value} {...textAreaProps} />;
}
