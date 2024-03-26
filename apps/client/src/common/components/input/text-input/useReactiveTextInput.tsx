import { ChangeEvent, KeyboardEvent, RefObject, useCallback, useEffect, useState } from 'react';

interface UseReactiveTextInputReturn {
  value: string;
  onChange: (event: ChangeEvent) => void;
  onBlur: (event: ChangeEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export default function useReactiveTextInput(
  initialText: string,
  submitCallback: (newValue: string) => void,
  ref: RefObject<unknown>,
  options?: {
    submitOnEnter?: boolean;
  },
): UseReactiveTextInputReturn {
  const [text, setText] = useState<string>(initialText);
  const elm = ref as RefObject<HTMLElement>;

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
      if (valueToSubmit === initialText) {
        return;
      }
      const cleanVal = valueToSubmit.trim();
      submitCallback(cleanVal);

      if (cleanVal !== valueToSubmit) {
        setText(cleanVal);
      }
    },
    [initialText, submitCallback],
  );

  /**
   * @description Handles common keys for submit and cancel
   * @param {KeyboardEvent} event
   */
  const keyHandler = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key;
      switch (key) {
        case 'Escape':
          setText(initialText);
          setTimeout(() => elm.current?.blur());
          event.stopPropagation();
          break;
        case 'Enter':
          if (options?.submitOnEnter) {
            handleSubmit(text);
            setTimeout(() => elm.current?.blur());
          }
          break;
      }
    },
    [initialText, options?.submitOnEnter, elm, handleSubmit, text],
  );

  return {
    value: text,
    onChange: (event: ChangeEvent) => handleChange((event.target as HTMLInputElement).value),
    onBlur: (event: ChangeEvent) => handleSubmit((event.target as HTMLInputElement).value),
    onKeyDown: (event: KeyboardEvent) => keyHandler(event),
  };
}
