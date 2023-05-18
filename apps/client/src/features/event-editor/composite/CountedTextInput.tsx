import { useCallback } from 'react';
import { Input } from '@chakra-ui/react';

import useReactiveTextInput from '../../../common/components/input/text-input/useReactiveTextInput';

import { TitleActions } from './EventEditorTitles';

import style from '../EventEditor.module.scss';

interface CountedTextInputProps {
  field: TitleActions;
  label: string;
  initialValue: string;
  submitHandler: (field: TitleActions, value: string) => void;
}

export default function CountedTextInput(props: CountedTextInputProps) {
  const { field, label, initialValue, submitHandler } = props;

  const submitCallback = useCallback((newValue: string) => submitHandler(field, newValue), [field, submitHandler]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, {
    submitOnEnter: true,
  });

  return (
    <div className={style.column}>
      <div className={style.countedInput}>
        <label className={style.inputLabel}>{label}</label>
        <span className={style.charCount}>{`${value.length} characters`}</span>
      </div>
      <Input
        size='sm'
        variant='ontime-filled'
        data-testid='input-textfield'
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
