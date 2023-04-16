import { HexAlphaColorPicker } from 'react-colorful';
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from '@chakra-ui/react';

import style from './PopoverPicker.module.scss';

interface PopoverPickerProps {
  color: string;
  width?: string;
  height?: string;
  onChange: (color: string) => void;
}

export default function PopoverPicker(props: PopoverPickerProps) {
  const { color, width = '28px', height = '28px', onChange } = props;

  const presetColors = [
    '#ffffffcc', // $timer-color
    '#FFAB33', // $orange-600
    '#ED3333', // $red-600
    '#FFCC78', // $orange-400
    '#77C785', // $green-400
    '#339E4E', // $green-600
    '#779BE7', // $blue-400
    '#3E75E8', // $blue-600
    '#FF7878', // $red-400
  ];

  return (
    <Popover placement='top'>
      <PopoverTrigger>
        <div className={style.swatch} style={{ backgroundColor: color, width: width, height: height }} />
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
