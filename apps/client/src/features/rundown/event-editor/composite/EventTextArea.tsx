import { type CSSProperties, useCallback, useRef } from 'react';

import { AutoTextArea } from '../../../../common/components/input/auto-text-area/AutoTextArea';
import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';
import * as Editor from '../../../editors/editor-utils/EditorUtils';
import { EditorUpdateFields } from '../EventEditor';

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
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const submitCallback = useCallback((newValue: string) => submitHandler(field, newValue), [field, submitHandler]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    submitOnCtrlEnter: true,
  });

  return (
    <div>
      <Editor.Label className={className} htmlFor={field} style={givenStyles}>
        {label}
      </Editor.Label>
      <AutoTextArea
        id={field}
        ref={ref}
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
