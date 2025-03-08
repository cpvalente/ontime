import { useEffect, useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

import 'prismjs/components/prism-json';

import 'prismjs/components/prism-css';
import 'prismjs/themes/prism-funky.min.css';
import style from './StyleEditor.module.scss';

const CodeEditor = ({ language = 'css', initialValue = '', onChange }) => {
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
      <Editor value={code} padding={15} onValueChange={handleChange} highlight={highlight} className={style.code} />
    </div>
  );
};

export default CodeEditor;
