import { useCallback, useRef } from 'react';
import { Input, Textarea } from '@chakra-ui/react';

import { EventEditorSubmitActions } from '../../../../features/event-editor/EventEditor';
import { Size } from '../../../models/Util.type';

import useReactiveTextInput from './useReactiveTextInput';

interface BaseProps {
  isTextArea?: boolean;
  isFullHeight?: boolean;
  size?: Size;
  field: EventEditorSubmitActions;
  initialText?: string;
  submitHandler: (field: EventEditorSubmitActions, newValue: string) => void;
}

interface TextAreaProps {
  isTextArea: true;
  resize?: 'horizontal' | 'vertical' | 'none';
}

type TextInputProps = BaseProps & TextAreaProps;

export default function TextInput(props: TextInputProps) {
  const { isTextArea, isFullHeight, size = 'sm', field, initialText = '', submitHandler, resize = 'none' } = props;
  const inputRef = useRef(null);

  const submitCallback = useCallback((newValue: string) => submitHandler(field, newValue), [field, submitHandler]);

  const textInputProps = useReactiveTextInput(initialText, submitCallback, { submitOnEnter: true });
  const textAreaProps = useReactiveTextInput(initialText, submitCallback);

  return isTextArea ? (
    <Textarea
      ref={inputRef}
      size={size}
      resize='none'
      variant='ontime-filled'
      {...textAreaProps}
      style={{ height: isFullHeight ? '100%' : undefined }}
      data-testid='input-textarea'
    />
  ) : (
    <Input ref={inputRef} size={size} variant='ontime-filled' {...textInputProps} data-testid='input-textfield' />
  );
}
