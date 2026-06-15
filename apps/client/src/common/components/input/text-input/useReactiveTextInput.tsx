import { HotkeyItem, getHotkeyHandler } from '@mantine/hooks';
import { ChangeEvent, KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { timeSync } from '../../../devtools/cuesheet-metrics/usePerfMark'; // PERF-METRICS

interface UseReactiveTextInputReturn {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

export default function useReactiveTextInput(
  initialText: string,
  submitCallback: (newValue: string) => void,
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  options?: {
    submitOnEnter?: boolean;
    submitOnCtrlEnter?: boolean;
    submitOnTab?: boolean;
    onCancelUpdate?: () => void;
    onTabCancel?: () => void;
    allowSubmitSameValue?: boolean;
    allowKeyboardNavigation?: boolean;
  },
): UseReactiveTextInputReturn {
  const [text, setText] = useState<string>(initialText);
  // track whether we are submitting via a submit key (eg enter) and avoid submitting again on blur
  const isKeyboardSubmitting = useRef(false);
  // track escape to prevent the subsequent blur from submitting
  const isEscaping = useRef(false);
  // track tab-out to prevent blur from submitting (used by timer cells)
  const isTabbing = useRef(false);

  useEffect(() => {
    if (typeof initialText === 'undefined') {
      setText('');
    } else {
      setText(initialText);
    }
  }, [initialText]);

  /**
   * @description Handles Input value change
   * @param {string} newValue
   */
  const handleChange = useCallback(
    (newValue: string) => {
      if (newValue !== text) {
        setText(newValue);
      }
    },
    [text],
  );

  /**
   * @description Handles submit events
   * @param {string} valueToSubmit
   */
  const handleSubmit = useCallback(
    (valueToSubmit: string) => {
      // No need to update if it hasn't changed
      if (valueToSubmit === initialText && !options?.allowSubmitSameValue) {
        options?.onCancelUpdate?.();
      } else {
        const cleanVal = valueToSubmit.trim();
        submitCallback(cleanVal);
        if (cleanVal !== valueToSubmit) {
          setText(cleanVal);
        }
      }

      setTimeout(() => {
        if (options?.allowKeyboardNavigation) {
          ref.current?.parentElement?.focus(); // Focus on parent element to continue keyboard navigation
        } else {
          ref.current?.blur();
        }
      }); // Immediate timeout to ensure text is set before blurring
    },
    [initialText, options, ref, submitCallback],
  );

  /**
   * @description Handles escape events
   * @param {string} valueToSubmit
   */
  const handleEscape = useCallback(() => {
    isEscaping.current = true;
    // No need to update if it hasn't changed
    setText(initialText);
    // force the text to be the initial value
    if (ref.current) {
      ref.current.value = initialText;
    }
    options?.onCancelUpdate?.();
    setTimeout(() => ref.current?.blur()); // Immediate timeout to ensure text is set before blurring
  }, [initialText, options, ref]);

  const keyHandler = useMemo(() => timeSync('cell.reactiveInputInit', () => { // PERF-METRICS
    const hotKeys: HotkeyItem[] = [
      [
        'Escape',
        (event) => {
          event.preventDefault();
          handleEscape();
        },
        { preventDefault: true },
      ],
    ];

    if (options?.submitOnEnter) {
      hotKeys.push([
        'Enter',
        () => {
          isKeyboardSubmitting.current = true;
          handleSubmit(text);
          // clear flag after blur has been processed
          setTimeout(() => {
            isKeyboardSubmitting.current = false;
          }, 0);
        },
      ]);
    }

    if (options?.submitOnCtrlEnter) {
      hotKeys.push([
        'mod + Enter',
        () => {
          isKeyboardSubmitting.current = true;
          handleSubmit(text);
          // clear flag after blur has been processed
          setTimeout(() => {
            isKeyboardSubmitting.current = false;
          }, 0);
        },
      ]);
    }

    const hotKeyHandler = getHotkeyHandler(hotKeys);

    return (event: KeyboardEvent<HTMLElement>) => {
      // allow moving in input field with arrow keys
      if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown'
      ) {
        event.stopPropagation();
      }

      // for cells that opt out of tab-submit, track tab-out without preventing navigation
      if (event.key === 'Tab' && options?.submitOnTab === false) {
        isTabbing.current = true;
      }

      hotKeyHandler(event);
    };
  }), [handleEscape, handleSubmit, options?.submitOnCtrlEnter, options?.submitOnEnter, options?.submitOnTab, text]); // PERF-METRICS

  return {
    value: text,
    onChange: (event) => handleChange(event.target.value),
    onBlur: (event) => {
      if (isTabbing.current) {
        isTabbing.current = false;
        (options?.onTabCancel ?? options?.onCancelUpdate)?.();
        return;
      }
      if (isEscaping.current) {
        isEscaping.current = false;
        return;
      }
      if (!isKeyboardSubmitting.current) {
        handleSubmit(event.target.value);
      }
    },
    onKeyDown: keyHandler,
  };
}
