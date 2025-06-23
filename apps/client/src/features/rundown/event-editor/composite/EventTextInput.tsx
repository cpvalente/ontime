import { useCallback, useRef } from 'react';
import { Input, InputProps } from '@chakra-ui/react';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';
import { EditorUpdateFields } from '../EventEditor';

interface EventTextInputProps extends InputProps {
  field: EditorUpdateFields;
  label: string;
  initialValue: string;
  placeholder?: string;
  submitHandler: (field: EditorUpdateFields, value: string) => void;
}

export default function EventTextInput(props: EventTextInputProps) {
  const { className, field, label, initialValue, style: givenStyles, submitHandler, maxLength, placeholder } = props;
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
        size='sm'
        variant='ontime-filled'
        data-testid='input-textfield'
        value={value}
        maxLength={maxLength || 100}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        autoComplete='off'
      />
    </div>
  );
}
