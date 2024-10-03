import { ChangeEvent, CSSProperties, useCallback, useRef, useState } from 'react';

import { AutoTextArea } from '../../../../common/components/input/auto-text-area/AutoTextArea';
import MarkdownArea from '../../../../common/components/input/markdown/MarkdownArea';
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
  isMarkdown?: boolean;
  submitHandler: (field: EditorUpdateFields, value: string) => void;
}

export default function EventTextArea(props: CountedTextAreaProps) {
  const { className, field, label, initialValue, style: givenStyles, submitHandler, isMarkdown } = props;
  const ref = useRef<HTMLInputElement | null>(null);
  const [editMarkdown, setEditMarkdown] = useState(false);
  const submitCallback = useCallback((newValue: string) => submitHandler(field, newValue), [field, submitHandler]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    submitOnCtrlEnter: true,
  });

  const onBlurIntercept = (event: ChangeEvent) => {
    onBlur(event);
    setEditMarkdown(false);
  };

  const classes = cx([style.inputLabel, className]);
  const showMarkdown = isMarkdown && !editMarkdown;

  return (
    <div>
      <label className={classes} htmlFor={field} style={givenStyles}>
        {label}
      </label>
      {showMarkdown ? (
        <MarkdownArea
          variant='ontime-filled'
          size='sm'
          value={value}
          submitHandler={submitCallback}
          editHandler={() => setEditMarkdown(true)}
        />
      ) : (
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
          onBlur={onBlurIntercept}
          onKeyDown={onKeyDown}
          autoFocus={editMarkdown}
        />
      )}
    </div>
  );
}
