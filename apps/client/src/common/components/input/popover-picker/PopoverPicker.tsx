import { PropsWithChildren } from 'react';
import { HexAlphaColorPicker, HexColorInput } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@chakra-ui/react';

import style from './PopoverPicker.module.scss';

interface PopoverPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export default function PopoverPicker(props: PropsWithChildren<PopoverPickerProps>) {
  const { color, onChange, children } = props;
  return (
    <Popover>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent className={style.small} style={{ borderRadius: '9px', width: 'auto' }}>
        <HexAlphaColorPicker color={color} onChange={onChange} />
        <HexColorInput color={color} onChange={onChange} className={style.input} prefixed />
      </PopoverContent>
    </Popover>
  );
}
