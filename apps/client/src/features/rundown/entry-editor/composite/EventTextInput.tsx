import { useCallback, useRef } from 'react';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import Input, { type InputProps } from '../../../../common/components/input/input/Input';
import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';
import { BlockEditorUpdateTextFields } from '../BlockEditor';
import { EventEditorUpdateFields } from '../EventEditor';

interface EntryEditorTextInputProps extends InputProps {
  field: EventEditorUpdateFields | BlockEditorUpdateTextFields;
  label: string;
  initialValue: string;
  placeholder?: string;
  submitHandler: (field: EventEditorUpdateFields, value: string) => void;
}

export default function EntryEditorTextInput({
  className,
  field,
  label,
  initialValue,
  style: givenStyles,
  submitHandler,
  maxLength,
  placeholder,
}: EntryEditorTextInputProps) {
  const ref = useRef<HTMLInputElement | null>(null);
  const submitCallback = useCallback((newValue: string) => submitHandler(field, newValue), [field, submitHandler]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    submitOnEnter: true,
  });

  return (
    <div>
      <Editor.Label className={className} htmlFor={field} style={givenStyles}>
        {label}
      </Editor.Label>
      <Input
        id={field}
        ref={ref}
        maxLength={maxLength}
        fluid
        data-testid='input-textfield'
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
