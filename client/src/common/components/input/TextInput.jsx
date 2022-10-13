import { useCallback, useEffect, useRef, useState } from 'react';
import { Input, Textarea } from '@chakra-ui/react';
import PropTypes from 'prop-types';

export default function TextInput(props) {
  const { isTextArea, size = 'sm', field, initialText = '', submitHandler } = props;
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
    (newValue) => {
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
    (valueToSubmit) => {
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
   * @description Resets input value to given
   */
  const resetValue = useCallback(async () => {
    setText(initialText);
  },[initialText])

  /**
   * @description Handles common keys for submit and cancel
   * @param {KeyboardEvent} event
   */
  const keyHandler = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        resetValue();
      } else if (event.key === 'Enter') {
        if (!isTextArea) {
          handleSubmit(text);
        }
      }
    },
    [resetValue, isTextArea, handleSubmit, text]
  );

  return isTextArea ? (
    <Textarea
      ref={inputRef}
      size={size}
      variant='filled'
      value={text}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={(event) => handleSubmit(event.target.value)}
      onKeyDown={(event) => keyHandler(event)}
      data-testid='input-textarea'
    />
  ) : (
    <Input
      ref={inputRef}
      size={size}
      variant='filled'
      value={text}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={(event) => handleSubmit(event.target.value)}
      onKeyDown={(event) => keyHandler(event)}
      data-testid='input-textfield'
    />
  );
}

TextInput.propTypes = {
  isTextArea: PropTypes.bool,
  size: PropTypes.string,
  field: PropTypes.string.isRequired,
  initialText: PropTypes.string,
  submitHandler: PropTypes.func,
};
