import { HexAlphaColorPicker } from 'react-colorful';
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from '@chakra-ui/react';

import style from './PopoverPicker.module.scss';

interface PopoverPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export default function PopoverPicker(props: PopoverPickerProps) {
  const { color, onChange } = props;

  const presetColors = [
    '#ffffffcc', // white
    '#F0D500cc', // warningyellow
    '#CA0B00cc', // dangerred
    '#FFCC78cc', // $orange-400
    '#FFAB33cc', // $orange-600
    '#77C785cc', // $green-400
    '#339E4Ecc', // $green-600
    '#779BE7cc', // $blue-400
    '#3E75E8cc', // $blue-600
    '#FF7878cc', // $red-400
    '#ED3333cc', // $red-600
    '#A790F5cc', // $violet-400
    '#8064E1cc', // $violet-600
    '#9d9d9dcc', // $gray-500
    '#ecececcc', // $gray-100
  ];

  return (
    <Popover placement='top'>
      <PopoverTrigger>
        <div className={style.swatch} style={{ backgroundColor: color }} />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverBody>
          <div className={style.picker}>
            <HexAlphaColorPicker color={color} onChange={onChange} className={style.reactcolorful} />
            <div className={style.picker__swatches}>
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  className={style.picker__swatch}
                  style={{ background: presetColor }}
                  onClick={() => onChange(presetColor)}
                />
              ))}
            </div>
          </div>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
