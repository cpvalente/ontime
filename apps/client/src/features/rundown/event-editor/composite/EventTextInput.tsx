import { useCallback } from 'react';
import { Input, InputProps } from '@chakra-ui/react';

import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';
import { EditorUpdateFields } from '../EventEditorWrapper';

import style from '../EventEditor.module.scss';

interface CountedTextInputProps extends InputProps {
  field: EditorUpdateFields;
  label: string;
  initialValue: string;
  submitHandler: (field: EditorUpdateFields, value: string) => void;
}

export default function EventTextInput(props: CountedTextInputProps) {
  const { field, label, initialValue, submitHandler, maxLength } = props;

  const submitCallback = useCallback((newValue: string) => submitHandler(field, newValue), [field, submitHandler]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, {
    submitOnEnter: true,
  });

  return (
    <div>
      <label className={style.inputLabel} htmlFor={field}>
        {label}
      </label>
      <Input
        id={field}
        size='sm'
        variant='ontime-filled'
        data-testid='input-textfield'
        value={value}
        maxLength={maxLength || 50}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        autoComplete='off'
      />
    </div>
  );
}
