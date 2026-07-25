import { useCallback, useRef } from 'react';

import * as Editor from '../../../../common/components/editor-utils/EditorUtils';
import Input, { type InputProps } from '../../../../common/components/input/input/Input';
import useReactiveTextInput from '../../../../common/components/input/text-input/useReactiveTextInput';
import { EventEditorUpdateFields } from '../EventEditor';
import { GroupEditorUpdateTextFields } from '../GroupEditor';

import style from '../EntryEditor.module.scss';

interface EntryEditorTextInputProps extends InputProps {
  field: EventEditorUpdateFields | GroupEditorUpdateTextFields;
  label: string;
  /** undefined represents values which do not agree across the edited entries */
  initialValue: string | undefined;
  placeholder?: string;
  submitHandler: (field: EventEditorUpdateFields, value: string) => void;
}

export default function EntryEditorTextInput({
  className,
  field,
  label,
  initialValue,
  style: givenStyles,
  submitHandler,
  maxLength,
  placeholder,
}: EntryEditorTextInputProps) {
  const ref = useRef<HTMLInputElement | null>(null);
  const submitCallback = useCallback((newValue: string) => submitHandler(field, newValue), [field, submitHandler]);

  const { value, onChange, onBlur, onKeyDown } = useReactiveTextInput(initialValue, submitCallback, ref, {
    submitOnEnter: true,
  });

  // an unknown value cannot be cleared by emptying the field, we offer an explicit action
  const canClear = initialValue === undefined;

  return (
    <div>
      <div className={style.labelRow}>
        <Editor.Label className={className} htmlFor={field} style={givenStyles}>
          {label}
        </Editor.Label>
        {canClear && (
          <button type='button' className={style.clearAction} onClick={() => submitCallback('')}>
            Clear
          </button>
        )}
      </div>
      <Input
        id={field}
        ref={ref}
        maxLength={maxLength}
        fluid
        data-testid='input-textfield'
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
