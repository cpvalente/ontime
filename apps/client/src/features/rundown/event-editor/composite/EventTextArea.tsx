import { CSSProperties, useCallback, useRef } from 'react';

import { AutoTextArea } from '../../../../common/components/input/auto-text-area/AutoTextArea';
import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';
import { cx } from '../../../../common/utils/styleUtils';
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
  const inputRef = useRef(null);
  const submitCallback = useCallback((newValue: string) => submitHandler(field, newValue), [field, submitHandler]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, inputRef);
  const classes = cx([style.inputLabel, className]);

  return (
    <div>
      <label className={classes} htmlFor={field} style={givenStyles}>
        {label}
      </label>
      <AutoTextArea
        id={field}
        inputRef={inputRef}
        rows={1}
        size='sm'
        resize='none'
        variant='ontime-filled'
        data-testid='input-textarea'
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className='escapable'
      />
    </div>
  );
}
