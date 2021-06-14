import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { useEffect, useState } from 'react';
import style from './EditableText.module.css';

export default function EditableText(props) {
  const { label, defaultValue, placeholder, submitHandler, ...rest } = props;
  const [text, setText] = useState(defaultValue || '');

  useEffect(() => {
    if (defaultValue == null) setText('');
    else setText(defaultValue);
  }, [defaultValue]);

  const handleSubmit = (submitedVal) => {
    // No need to update if it hasnt changed
    if (submitedVal === defaultValue) return;
    submitHandler(submitedVal);
  };

  const handleChange = (val) => {
    if (val.length < 40) setText(val);
  };

  return (
    <div className={style.block}>
      <span className={style.title}>{label}</span>
      <Editable
        onChange={(v) => handleChange(v)}
        onSubmit={(v) => handleSubmit(v)}
        value={text}
        placeholder={placeholder}
        className={style.inline}
        {...rest}
      >
        <EditablePreview
          color={text === '' ? '#666' : 'inherit'}
          maxWidth='75%'
        />
        <EditableInput overflowX='hidden' maxWidth='75%' />
      </Editable>
    </div>
  );
}
