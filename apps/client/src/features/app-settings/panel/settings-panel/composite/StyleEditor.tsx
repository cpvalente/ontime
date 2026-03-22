import { memo } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'virtual:prismjs';
import 'prismjs/components/prism-css';
import 'prismjs/themes/prism-tomorrow.min.css';
import style from './StyleEditor.module.scss';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
}

export default memo(CodeEditor);
function CodeEditor({ language, onChange, value }: CodeEditorProps) {
  const highlight = (code: string) => {
    const grammar = Prism.languages[language];
    return grammar ? Prism.highlight(code, grammar, language) : code;
  };

  return (
    <div className={style.wrapper}>
      <Editor
        value={value}
        padding={15}
        onValueChange={onChange}
        highlight={highlight}
        style={{
          fontFamily: 'monospace',
          fontSize: 12,
          minHeight: 500,
          background: 'transparent',
        }}
      />
    </div>
  );
}
