import { Input } from '@chakra-ui/react';

import style from './ColourInput.module.scss';

interface ColourInputProps {
  value: string;
  handleChange: (newValue: string) => void;
}

export default function ColourInput(props: ColourInputProps) {
  const { value, handleChange } = props;
  return (
    <Input
      size='sm'
      variant='ontime-filled'
      className={style.colourInput}
      type='color'
      value={value}
      onChange={(event) => handleChange(event.target.value)}
    />
  );
}
