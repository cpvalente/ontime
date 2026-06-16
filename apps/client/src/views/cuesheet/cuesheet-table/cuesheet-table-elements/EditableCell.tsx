import { memo, useCallback, useEffect, useRef, useState } from 'react';

import MultiLineCell from './MultiLineCell';
import SingleLineCell from './SingleLineCell';
import TextLikeInput from './TextLikeInput';

interface EditableCellProps {
  initialValue: string;
  multiline?: boolean;
  fieldId?: string;
  fieldLabel?: string;
  handleUpdate: (newValue: string) => void;
}

interface FocusableEditor {
  focus: () => void;
  select?: () => void;
}

/**
 * Lazily mounts the text editor for a cell.
 *
 * Mounting an `<input>`/`<textarea>` editor (with its reactive-input hooks and autosize) for every
 * cell is expensive when many rows mount at once during virtualised scroll. While the cell is not
 * being edited we render a lightweight, focusable display element and only mount the real editor
 * when the user clicks/focuses the cell — mirroring how the time/duration cells already behave.
 */
function EditableCell({ initialValue, multiline, fieldId, fieldLabel, handleUpdate }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<FocusableEditor | null>(null);

  // focus the editor once it mounts on entering edit mode
  useEffect(() => {
    if (isEditing) {
      editorRef.current?.focus();
      editorRef.current?.select?.();
    }
  }, [isEditing]);

  const enterEdit = useCallback(() => setIsEditing(true), []);

  const onSubmit = useCallback(
    (newValue: string) => {
      setIsEditing(false);
      handleUpdate(newValue);
    },
    [handleUpdate],
  );

  const onCancel = useCallback(() => setIsEditing(false), []);

  if (!isEditing) {
    return (
      <TextLikeInput
        onClick={enterEdit}
        onFocus={enterEdit}
        multiline={multiline}
        aria-label={fieldLabel ? `${fieldLabel} cell` : undefined}
      >
        {initialValue}
      </TextLikeInput>
    );
  }

  return multiline ? (
    <MultiLineCell
      ref={editorRef}
      initialValue={initialValue}
      fieldId={fieldId}
      fieldLabel={fieldLabel}
      handleUpdate={onSubmit}
      handleCancelUpdate={onCancel}
    />
  ) : (
    <SingleLineCell
      ref={editorRef}
      initialValue={initialValue}
      fieldId={fieldId}
      fieldLabel={fieldLabel}
      handleUpdate={onSubmit}
      handleCancelUpdate={onCancel}
    />
  );
}

export default memo(EditableCell);
