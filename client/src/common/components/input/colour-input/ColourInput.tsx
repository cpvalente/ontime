import { Input } from '@chakra-ui/react';

import { EventEditorSubmitActions } from '../../../../features/event-editor/EventEditor';

import style from './ColourInput.module.scss';

interface ColourInputProps {
  value: string;
  name: EventEditorSubmitActions;
  handleChange: (newValue: EventEditorSubmitActions, name: string) => void;
}

export default function ColourInput(props: ColourInputProps) {
  const { value, name, handleChange } = props;
  return (
    <Input
      size='sm'
      variant='ontime-filled'
      className={style.colourInput}
      type='color'
      value={value}
      onChange={(event) => handleChange(name, event.target.value)}
    />
  );
}
