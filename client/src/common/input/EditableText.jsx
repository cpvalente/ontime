import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import { useEffect, useState } from 'react';
import style from './EditableText.module.scss';
import PropTypes from 'prop-types';

export default function EditableText(props) {
  const { label, defaultValue, placeholder, submitHandler, maxchar = 40, ...rest } = props;
  const [text, setText] = useState(defaultValue || '');

  useEffect(() => {
    if (defaultValue == null) setText('');
    else setText(defaultValue);
  }, [defaultValue]);

  const handleSubmit = (submittedVal) => {
    // No need to update if it hasnt changed
    if (submittedVal === defaultValue) return;
    // submit a cleaned up version of the string
    const cleanVal = submittedVal.trim();
    submitHandler(cleanVal);

    if (cleanVal !== submittedVal) {
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

EditableText.propTypes = {
  label: PropTypes.string,
  defaultValue: PropTypes.string,
  placeholder: PropTypes.string,
  submitHandler: PropTypes.func.isRequired,
  maxchar: PropTypes.number,
};
