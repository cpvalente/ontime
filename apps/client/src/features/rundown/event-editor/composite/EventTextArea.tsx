import { CSSProperties, useCallback, useRef } from 'react';

import { AutoTextArea } from '../../../../common/components/input/auto-text-area/AutoTextArea';
import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';
import { cx } from '../../../../common/utils/styleUtils';
import { EditorSubmitHandler, EditorUpdateFields } from '../EventEditor';

import style from '../EventEditor.module.scss';

interface CountedTextAreaProps {
  className?: string;
  field: keyof EditorUpdateFields | string;
  forCustom?: boolean;
  label: string;
  initialValue: string;
  style?: CSSProperties;
  submitHandler: EditorSubmitHandler;
}

export default function EventTextArea(props: CountedTextAreaProps) {
  const { className, field, label, initialValue, style: givenStyles, submitHandler, forCustom } = props;
  const ref = useRef<HTMLInputElement | null>(null);
  const submitCallback = useCallback(
    (newValue: string) =>
      forCustom ? submitHandler({ custom: { [field]: newValue } }) : submitHandler({ [field]: newValue }),
    [field, forCustom, submitHandler],
  );

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    submitOnCtrlEnter: true,
  });
  const classes = cx([style.inputLabel, className]);

  return (
    <div>
      <label className={classes} htmlFor={field} style={givenStyles}>
        {label}
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
    </div>
  );
}
