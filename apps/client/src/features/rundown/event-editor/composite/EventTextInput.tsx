import { useCallback, useRef } from 'react';
import { Input, InputProps } from '@chakra-ui/react';

import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';
import Freezable from '../../../../features/rundown/freezable/Freezable';
import { EditorUpdateFields } from '../EventEditor';

import style from '../EventEditor.module.scss';

interface EventTextInputProps extends InputProps {
  field: EditorUpdateFields;
  label: string;
  initialValue: string;
  submitHandler: (field: EditorUpdateFields, value: string) => void;
}

export default function EventTextInput(props: EventTextInputProps) {
  const { field, label, initialValue, submitHandler, maxLength } = props;
  const ref = useRef<HTMLInputElement | null>(null);
  const submitCallback = useCallback((newValue: string) => submitHandler(field, newValue), [field, submitHandler]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    submitOnEnter: true,
  });

  return (
    <Freezable>
      {({ frozen, FrozenIcon }) => (
        <>
          <label className={style.inputLabel} htmlFor={field}>
            {label} <FrozenIcon />
          </label>
          <Input
            id={field}
            ref={ref}
            size='sm'
            variant={frozen ? 'ontime-readonly' : 'ontime-filled'}
            data-testid='input-textfield'
            value={value}
            maxLength={maxLength || 100}
            onChange={onChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoComplete='off'
          />
        </>
      )}
    </Freezable>
  );
}
