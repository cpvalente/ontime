import { Editable, EditableInput, EditablePreview } from '@chakra-ui/editable';
import style from './EditableText.module.css';

export default function EditableText(props) {
  const { label, defaultValue, placeholder, handleSubmit } = props;
  return (
    <div style={{ display: 'block' }}>
      <span className={props.underlined ? style.titleUnderlined : style.title}>
        {label}
      </span>
      <Editable
        onSubmit={(v) => handleSubmit(v)}
        defaultValue={defaultValue}
        placeholder={placeholder}
        style={{ display: 'inline' }}
      >
        <EditablePreview />
        <EditableInput style={{ width: '13em', minWidth: '13em' }} />
      </Editable>
    </div>
  );
}
