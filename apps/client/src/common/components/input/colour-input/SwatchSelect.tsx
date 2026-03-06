import { useCallback } from 'react';

import Swatch from './Swatch';
import SwatchPicker from './SwatchPicker';

import style from './SwatchSelect.module.scss';

interface ColourInputProps {
  value: string;
  name: 'colour';
  handleChange: (newValue: 'colour', name: string) => void;
  /** When true, no swatch appears selected */
  noSelection?: boolean;
}

const colours = [
  '',
  '#FFCC78', // $orange-400
  '#FFAB33', // $orange-600
  '#77C785', // $green-400
  '#339E4E', // $green-600
  '#779BE7', // $blue-400
  '#3E75E8', // $blue-600
  '#FF7878', // $red-400
  '#ED3333', // $red-600
  '#A790F5', // $violet-400
  '#8064E1', // $violet-600
  '#9d9d9d', // $gray-500
  '#ececec', // $gray-100
];

export default function SwatchSelect(props: ColourInputProps) {
  const { value, name, handleChange, noSelection } = props;

  const setColour = useCallback(
    (newValue: string) => {
      if (newValue !== value) {
        handleChange(name, newValue);
      }
    },
    [handleChange, name, value],
  );

  return (
    <div className={style.list}>
      {colours.map((colour) => (
        <Swatch key={colour} color={colour} onClick={setColour} isSelected={!noSelection && value === colour} />
      ))}
      <SwatchPicker color={value} onChange={setColour} isSelected={!noSelection && !colours.includes(value)} />
    </div>
  );
}
