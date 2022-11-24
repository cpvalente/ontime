import { useCallback, useEffect, useRef, useState } from 'react';
import { Input, Textarea } from '@chakra-ui/react';

import { Size } from '../../models/UtilTypes';

interface TextInputProps {
  isTextArea?: boolean;
  isFullHeight?: boolean;
  size?: Size;
  field: string;
  initialText?: string;
  submitHandler: (field: string, newValue: string) => void;
}

export default function TextInput(props: TextInputProps) {
  const { isTextArea, isFullHeight, size = 'sm', field, initialText = '', submitHandler } = props;
  const inputRef = useRef(null);
  const [text, setText] = useState(initialText);

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
    [text]
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
      submitHandler(field, cleanVal);

      if (cleanVal !== valueToSubmit) {
        setText(cleanVal);
      }
    },
    [field, initialText, submitHandler]
  );

  /**
   * @description Handles common keys for submit and cancel
   * @param {string} key
   */
  const keyHandler = useCallback(
    (key: string) => {
      if (key === 'Escape') {
        setText(initialText);
      } else if (key === 'Enter') {
        if (!isTextArea) {
          handleSubmit(text);
        }
      }
    },
    [initialText, isTextArea, handleSubmit, text]
  );

  return isTextArea ? (
    <Textarea
      ref={inputRef}
      size={size}
      variant='ontime-filled'
      value={text}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={(event) => handleSubmit(event.target.value)}
      onKeyDown={(event) => keyHandler(event.key)}
      style={{height: isFullHeight ? '100%' : undefined }}
      data-testid='input-textarea'
    />
  ) : (
    <Input
      ref={inputRef}
      size={size}
      variant='ontime-filled'
      value={text}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={(event) => handleSubmit(event.target.value)}
      onKeyDown={(event) => keyHandler(event.key)}
      data-testid='input-textfield'
    />
  );
}
