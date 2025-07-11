import {
  $getRoot,
  $getSelection,
  EditorState,
  LexicalEditor,
} from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import React, { useState, useCallback } from 'react';

interface LexicalEditorCellProps {
  initialValue: string;
  onSave: (value: string) => void;
}

const editorTheme = {
  // Minimal theme, can be expanded later
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
};

function LexicalEditorCell({ initialValue, onSave }: LexicalEditorCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  const initialConfig = {
    namespace: 'LexicalEditorCell',
    theme: editorTheme,
    onError: (error: Error) => {
      console.error(error);
      // Optionally, you could add more robust error handling here,
      // like notifying the user or attempting to recover.
    },
    editorState: null, // No initial editor state when not editing
  };

  const handleCellClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editorState) {
      editorState.read(() => {
        const root = $getRoot();
        const selection = $getSelection();
        // For simplicity, we'll just get the text content.
        // For actual rich text, you'd want to serialize to JSON.
        const newTextValue = root.getTextContent();
        onSave(newTextValue);
        setCurrentValue(newTextValue); // Update local display value
      });
    }
  }, [onSave, editorState]);

  const onChange = (newEditorState: EditorState, editor: LexicalEditor) => {
    setEditorState(newEditorState);
  };

  if (!isEditing) {
    return (
      <div onClick={handleCellClick} style={{ cursor: 'pointer', minHeight: '20px', padding: '5px' }}>
        {currentValue || <span style={{color: '#aaa'}}>Click to edit...</span>}
      </div>
    );
  }

  return (
    <LexicalComposer initialConfig={{...initialConfig, editorState: currentValue ? undefined : null}}>
      <RichTextPlugin
        contentEditable={<ContentEditable style={{minHeight: '150px', resize:'vertical', overflow:'auto', border:'1px solid #ccc', padding: '5px'}} />}
        placeholder={<div style={{color: '#aaa', position: 'absolute', top: '30px', left: '10px'}}>Enter some text...</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <OnChangePlugin onChange={onChange} />
      {/* We need a way to trigger save, onBlur for the ContentEditable is one way */}
      {/* Attaching onBlur directly to ContentEditable or its parent div within Lexical structure */}
      <div onBlur={handleBlur} tabIndex={-1}> {/* Wrapper to capture blur */}
        {/* This div is part of the Lexical structure and will be replaced by ContentEditable */}
      </div>
    </LexicalComposer>
  );
}

export default LexicalEditorCell;
