import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from '@chakra-ui/react';

import style from './PopoverPicker.module.scss';

interface PopoverPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export default function PopoverPicker(props: PopoverPickerProps) {
  const { color, onChange } = props;

  const presetColors = [
    '#FFCC78',
    '#FFAB33',
    '#77C785',
    '#339E4E',
    '#779BE7',
    '#3E75E8',
    '#FF7878',
    '#ED3333',
    '#A790F5',
  ];

  return (
    <Popover placement='top'>
      <PopoverTrigger>
        <div className={style.swatch} style={{ backgroundColor: color }} />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverBody>
          <div className={style.picker}>
            <HexColorPicker color={color} onChange={onChange} className={style.reactcolorful} />
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
