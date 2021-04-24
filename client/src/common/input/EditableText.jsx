import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { useState } from 'react';
import style from './EditableText.module.css';

export default function EditableText(props) {
  const { label, defaultValue, placeholder, submitHandler } = props;
  const [text, setText] = useState(props.defaultValue || '');

  const handleSubmit = (submitedVal) => {
    // No need to update if it hasnt changed
    if (submitedVal === defaultValue) return;

    submitHandler(submitedVal);
  };

  const handleChange = (val) => {
    if (val.length < 40) setText(val);
    console.log(val.length);
  };

  return (
    <div className={style.block}>
      <span className={props.underlined ? style.titleUnderlined : style.title}>
        {label}
      </span>
      <Editable
        onChange={(v) => handleChange(v)}
        onSubmit={(v) => handleSubmit(v)}
        value={text}
        placeholder={placeholder}
        className={style.inline}
      >
        <EditablePreview />
        <EditableInput />
      </Editable>
    </div>
  );
}
