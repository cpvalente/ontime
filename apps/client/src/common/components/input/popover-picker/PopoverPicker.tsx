import { PropsWithChildren } from 'react';
import { HexAlphaColorPicker, HexColorInput } from 'react-colorful';

import { PopoverBody, PopoverContent, PopoverRoot, PopoverTrigger } from '../../ui/popover';

import style from './PopoverPicker.module.scss';

interface PopoverPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export default function PopoverPicker(props: PropsWithChildren<PopoverPickerProps>) {
  const { color, onChange, children } = props;
  return (
    <PopoverRoot>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent className={style.small} style={{ borderRadius: '9px', width: 'auto' }}>
        <PopoverBody>
          <HexAlphaColorPicker color={color} onChange={onChange} />
          <HexColorInput color={color} onChange={onChange} className={style.input} prefixed />
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
}
