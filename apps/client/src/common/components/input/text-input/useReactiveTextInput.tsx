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
  ref: RefObject<HTMLInputElement>,
  options?: {
    submitOnEnter?: boolean;
  },
): UseReactiveTextInputReturn {
  const [text, setText] = useState<string>(initialText);

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
   * @param {string} key
   */
  const keyHandler = useCallback(
    (key: string) => {
      switch (key) {
        case 'Escape':
          setText(initialText);
          if (ref.current) {
            ref.current.blur();
          }
          break;
        case 'Enter':
          if (options?.submitOnEnter) {
            handleSubmit(text);
          }
          break;
      }
    },
    [initialText, options?.submitOnEnter, handleSubmit, text],
  );

  return {
    value: text,
    onChange: (event: ChangeEvent) => handleChange((event.target as HTMLInputElement).value),
    onBlur: (event: ChangeEvent) => handleSubmit((event.target as HTMLInputElement).value),
    onKeyDown: (event: KeyboardEvent) => keyHandler(event.key),
  };
}
