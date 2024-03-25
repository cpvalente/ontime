import { useCallback, useRef } from 'react';
import { Input, Textarea } from '@chakra-ui/react';

import { EventEditorSubmitActions } from '../../../../features/rundown/event-editor/EventEditor';
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

interface TextInputProps extends BaseProps {
  isTextArea?: false;
}

type ResizeOptions = 'horizontal' | 'vertical' | 'none';

interface TextAreaProps extends BaseProps {
  isTextArea: true;
  resize?: ResizeOptions;
}

type InputProps = TextInputProps | TextAreaProps;

export default function TextInput(props: InputProps) {
  const { isTextArea, isFullHeight, size = 'sm', field, initialText = '', submitHandler } = props;
  const inputRef = useRef(null);

  const submitCallback = useCallback((newValue: string) => submitHandler(field, newValue), [field, submitHandler]);

  const textInputProps = useReactiveTextInput(initialText, submitCallback, { submitOnEnter: true });
  const textAreaProps = useReactiveTextInput(initialText, submitCallback);

  let resize: ResizeOptions = 'none';
  if (isTextArea) {
    resize = (props as TextAreaProps)?.resize ?? 'none';
  }

  return isTextArea ? (
    <Textarea
      ref={inputRef}
      size={size}
      resize={resize}
      variant='ontime-filled'
      {...textAreaProps}
      style={{ height: isFullHeight ? '100%' : undefined }}
      data-testid='input-textarea'
      className='escapable'
    />
  ) : (
    <Input
      ref={inputRef}
      size={size}
      variant='ontime-filled'
      {...textInputProps}
      data-testid='input-textfield'
      className='escapable'
    />
  );
}
