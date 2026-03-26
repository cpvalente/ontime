import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { Annotation, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { memo, useEffect, useRef } from 'react';

import style from './StyleEditor.module.scss';

interface StyleEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const editorExtensions = [keymap.of([indentWithTab, ...defaultKeymap]), css(), vscodeDark];
const externalValueSync = Annotation.define<boolean>();

export default memo(StyleEditor);
function StyleEditor({ onChange, value }: StyleEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep the latest callback available to the editor listener without recreating the editor instance.
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create the CodeMirror editor once and wire document changes back to React state.
  useEffect(() => {
    if (viewRef.current) {
      return;
    }

    const parent = hostRef.current;
    if (!parent) {
      return;
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) {
        return;
      }
      if (update.transactions.some((transaction) => transaction.annotation(externalValueSync))) {
        return;
      }
      onChangeRef.current(update.state.doc.toString());
    });

    const state = EditorState.create({
      doc: value,
      extensions: [...editorExtensions, updateListener],
    });

    const view = new EditorView({ state, parent });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Apply external value updates to the editor when they differ from the current document.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }

    const currentValue = view.state.doc.toString();
    if (currentValue === value) {
      return;
    }
    if (view.hasFocus) {
      return;
    }

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      annotations: externalValueSync.of(true),
    });
  }, [value]);

  return <div className={style.editor} ref={hostRef} />;
}
