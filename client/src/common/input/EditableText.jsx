import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { useEffect, useState } from 'react';
import style from './EditableText.module.scss';

export default function EditableText(props) {
  const { label, defaultValue, placeholder, submitHandler, ...rest } = props;
  const [text, setText] = useState(defaultValue || '');
  const maxchar = props.maxchar || 40;

  useEffect(() => {
    if (defaultValue == null) setText('');
    else setText(defaultValue);
  }, [defaultValue]);

  const handleSubmit = (submitedVal) => {
    // No need to update if it hasnt changed
    if (submitedVal === defaultValue) return;
    // submit a cleaned up version of the string
    const cleanVal = submitedVal.trim();
    submitHandler(cleanVal);

    if (cleanVal !== submitedVal) {
      setText(cleanVal);
    }
  };

  const handleChange = (val) => {
    if (val.length < maxchar) setText(val);
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
        <EditablePreview color={text === '' ? '#666' : 'inherit'} maxWidth='75%' />
        <EditableInput overflowX='hidden' maxWidth='75%' />
      </Editable>
    </div>
  );
}
