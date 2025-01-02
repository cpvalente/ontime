import { useState } from 'react';

import SwatchPicker from '../input/colour-input/SwatchPicker';

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

  return (
    <div className={style.inline}>
      <SwatchPicker color={colour} onChange={setColour} alwaysDisplayColor />
      <span>{colour}</span>
      <input type='hidden' name={name} value={colour} />
    </div>
  );
}
