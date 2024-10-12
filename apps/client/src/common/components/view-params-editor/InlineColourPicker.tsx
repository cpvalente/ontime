import { useState } from 'react';

import PopoverPicker from '../input/popover-picker/PopoverPicker';

import style from './InlineColourPicker.module.scss';

interface InlineColourPickerProps {
  name: string;
  value: string;
}

const ensureHex = (value: string) => {
  if (!value.startsWith('#')) {
    return `#${value}`;
  }
  return value;
};

export default function InlineColourPicker(props: InlineColourPickerProps) {
  const { name, value } = props;
  const [colour, setColour] = useState(() => ensureHex(value));

  const debouncedChange = (value: string) => {
    setColour(value);
  };

  return (
    <div className={style.inline}>
      <PopoverPicker color={colour} onChange={debouncedChange} />
      <input type='hidden' name={name} value={colour} />
    </div>
  );
}
