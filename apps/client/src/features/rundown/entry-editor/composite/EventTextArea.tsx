import { type CSSProperties, useCallback, useRef } from 'react';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import { AutoTextarea } from '../../../../common/components/input/auto-textarea/AutoTextarea';
import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';
import { EventEditorUpdateFields } from '../EventEditor';

interface CountedTextAreaProps {
  className?: string;
  field: EventEditorUpdateFields;
  label: string;
  initialValue: string;
  style?: CSSProperties;
  submitHandler: (field: EventEditorUpdateFields, value: string) => void;
}

export default function EventTextArea({
  className,
  field,
  label,
  initialValue,
  style: givenStyles,
  submitHandler,
}: CountedTextAreaProps) {
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
      <AutoTextarea
        id={field}
        inputref={ref}
        rows={1}
        data-testid='input-textarea'
        fluid
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
