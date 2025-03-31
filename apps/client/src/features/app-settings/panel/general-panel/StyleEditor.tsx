import { forwardRef, memo, useEffect, useImperativeHandle, useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs/components/prism-core';

import 'prismjs/components/prism-css';
import 'prismjs/themes/prism-tomorrow.min.css';
import style from './StyleEditor.module.scss';

interface CodeEditorProps {
  language: string;
  initialValue: string;
  isDirty: boolean;
  setIsDirty: (value: boolean) => void;
}

const CodeEditor = forwardRef((props: CodeEditorProps, cssRef) => {
  const { language, initialValue, isDirty, setIsDirty } = props;

  const [code, setCode] = useState(initialValue);

  const highlight = (code: string) => {
    const grammar = Prism.languages[language];
    return grammar ? Prism.highlight(code, grammar, language) : code;
  };

  const handleChange = (newCode: string) => {
    setCode(newCode);
  };

  useImperativeHandle(cssRef, () => {
    return {
      getCss: () => code,
    };
  });

  // add contents to editor on mount and any change in initialValue
  useEffect(() => {
    console.log("value changed")
    setCode(initialValue);
  }, [initialValue]);

  // handle dirty state on change
  useEffect(() => {
    if (initialValue.trim() !== code.trim() && !isDirty && code.length !== 0) {
      setIsDirty(true);
    }

    if (initialValue.trim() === code.trim() && isDirty) {
      setIsDirty(false);
    }
  }, [initialValue, code]);

  return (
    <div className={style.wrapper}>
      <Editor
        value={code}
        padding={15}
        onValueChange={handleChange}
        highlight={highlight}
        style={{
          fontFamily: 'monospace',
          fontSize: 12,
          minHeight: 500,
          background: '#2d2d2d', // Background of tomorrow theme
        }}
      />
    </div>
  );
});

CodeEditor.displayName = 'StyleEditor';

export default memo(CodeEditor);
