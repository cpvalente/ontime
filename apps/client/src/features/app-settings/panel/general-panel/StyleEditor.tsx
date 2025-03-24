import { memo, useEffect, useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs/components/prism-core';

import 'prismjs/components/prism-css';

import 'prismjs/themes/prism-tomorrow.min.css';

import style from './StyleEditor.module.scss';

interface CodeEditorProps {
  language: string;
  initialValue: string;
  onChange: (newValue: string) => void;
}

function CodeEditor(props: CodeEditorProps) {
  const { language, initialValue, onChange } = props;

  const [code, setCode] = useState(initialValue);

  useEffect(() => {
    setCode(initialValue);
  }, [initialValue]);

  const highlight = (code: string) => {
    const grammar = Prism.languages[language];
    return grammar ? Prism.highlight(code, grammar, language) : code;
  };

  const handleChange = (newCode: string) => {
    setCode(newCode);
    if (onChange) onChange(newCode);
  };

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
}

export default memo(CodeEditor);
