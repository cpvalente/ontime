import { useCallback } from 'react';
import { Textarea } from '@chakra-ui/react';

import useReactiveTextInput from '../../../common/components/input/text-input/useReactiveTextInput';

import { TitleActions } from './EventEditorTitles';

import style from '../EventEditor.module.scss';

interface CountedTextAreaProps {
  field: TitleActions;
  label: string;
  initialValue: string;
  submitHandler: (field: TitleActions, value: string) => void;
}

export default function CountedTextArea(props: CountedTextAreaProps) {
  const { field, label, initialValue, submitHandler } = props;

  const submitCallback = useCallback((newValue: string) => submitHandler(field, newValue), [field, submitHandler]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback);

  return (
    <div className={`${style.column} ${style.fullHeight}`}>
      <div className={style.countedInput}>
        <label className={style.inputLabel}>{label}</label>
        <span className={style.charCount}>{`${value.length} characters`}</span>
      </div>
      <Textarea
        size='sm'
        resize='none'
        variant='ontime-filled'
        style={{ height: '100%' }}
        data-testid='input-textarea'
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
