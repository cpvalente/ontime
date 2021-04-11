import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import style from './EditableText.module.css';

export default function EditableText(props) {
  const { label, defaultValue, placeholder, submitHandler } = props;

  const handleSubmit = (submitedVal) => {
    // No need to update if it hasnt changed
    if (submitedVal === defaultValue) return;

    submitHandler(submitedVal);
  };

  return (
    <div className={style.block}>
      <span className={props.underlined ? style.titleUnderlined : style.title}>
        {label}
      </span>
      <Editable
        onSubmit={(v) => handleSubmit(v)}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={style.inline}
      >
        <EditablePreview />
        <EditableInput className={style.editable13} />
      </Editable>
    </div>
  );
}
