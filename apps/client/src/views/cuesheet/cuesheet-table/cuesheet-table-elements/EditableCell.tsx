import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';

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

interface FocusableDisplay {
  focusParentElement: () => void;
}

/**
 * Lazily mounts the text editor for a cell.
 *
 * Mounting an `<input>`/`<textarea>` editor (with its reactive-input hooks and autosize) for every
 * cell is expensive when many rows mount at once during virtualised scroll. While the cell is not
 * being edited we render a lightweight, focusable display element and only mount the real editor
 * when the user clicks/focuses the cell — mirroring how the time/duration cells already behave.
 *
 * On exit we return focus to the parent cell (through the display element, in a layout effect once
 * it is back in the DOM) so the table keyboard navigation keeps working — the editor is unmounted
 * by then, so we cannot rely on its own ref.
 */
function EditableCell({ initialValue, multiline, fieldId, fieldLabel, handleUpdate }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const wasEditing = useRef(false);
  const editorRef = useRef<FocusableEditor | null>(null);
  const displayRef = useRef<FocusableDisplay | null>(null);

  useLayoutEffect(() => {
    if (isEditing) {
      // focus the editor once it mounts on entering edit mode
      editorRef.current?.focus();
      editorRef.current?.select?.();
    } else if (wasEditing.current) {
      // returning from edit: hand focus back to the cell so table keyboard navigation continues
      displayRef.current?.focusParentElement();
    }
    wasEditing.current = isEditing;
  }, [isEditing]);

  const enterEdit = useCallback(() => setIsEditing(true), []);
  const exitEdit = useCallback(() => setIsEditing(false), []);

  const onSubmit = useCallback(
    (newValue: string) => {
      setIsEditing(false);
      handleUpdate(newValue);
    },
    [handleUpdate],
  );

  if (!isEditing) {
    return (
      <TextLikeInput
        ref={displayRef}
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
      handleCancelUpdate={exitEdit}
    />
  ) : (
    <SingleLineCell
      ref={editorRef}
      initialValue={initialValue}
      fieldId={fieldId}
      fieldLabel={fieldLabel}
      handleUpdate={onSubmit}
      handleCancelUpdate={exitEdit}
    />
  );
}

export default memo(EditableCell);

