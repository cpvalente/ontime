import { HexAlphaColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@chakra-ui/react';

import style from './PopoverPicker.module.scss';

interface PopoverPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export default function PopoverPicker(props: PopoverPickerProps) {
  const { color, onChange } = props;

  return (
    <Popover>
      <PopoverTrigger>
        <div className={style.swatch} style={{ backgroundColor: color }} />
      </PopoverTrigger>
      <PopoverContent style={{ width: 'auto' }}>
        <HexAlphaColorPicker color={color} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}
