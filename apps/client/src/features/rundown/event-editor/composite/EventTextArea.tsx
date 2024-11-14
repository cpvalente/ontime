import { CSSProperties, useCallback, useRef } from 'react';

import { AutoTextArea } from '../../../../common/components/input/auto-text-area/AutoTextArea';
import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';
import { cx } from '../../../../common/utils/styleUtils';
import Freezable from '../../../../features/rundown/freezable/Freezable';
import { EditorUpdateFields } from '../EventEditor';

import style from '../EventEditor.module.scss';

interface CountedTextAreaProps {
  className?: string;
  field: EditorUpdateFields;
  label: string;
  initialValue: string;
  style?: CSSProperties;
  submitHandler: (field: EditorUpdateFields, value: string) => void;
}

export default function EventTextArea(props: CountedTextAreaProps) {
  const { className, field, label, initialValue, style: givenStyles, submitHandler } = props;
  const ref = useRef<HTMLInputElement | null>(null);
  const submitCallback = useCallback((newValue: string) => submitHandler(field, newValue), [field, submitHandler]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    submitOnCtrlEnter: true,
  });
  const classes = cx([style.inputLabel, className]);

  return (
    <Freezable>
      {({ FrozenIcon }) => (
        <>
          <label className={classes} htmlFor={field} style={givenStyles}>
            {label} <FrozenIcon />
          </label>
          <AutoTextArea
            id={field}
            inputref={ref}
            rows={1}
            size='sm'
            resize='none'
            variant='ontime-filled'
            data-testid='input-textarea'
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
          />
        </>
      )}
    </Freezable>
  );
}
