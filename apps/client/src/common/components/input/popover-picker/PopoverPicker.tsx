import { Popover } from '@base-ui/react/popover';
import { PropsWithChildren } from 'react';
import { HexAlphaColorPicker, HexColorInput } from 'react-colorful';

import PopoverContents from '../../popover/Popover';

import style from './PopoverPicker.module.scss';

interface PopoverPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export default function PopoverPicker({ color, onChange, children }: PropsWithChildren<PopoverPickerProps>) {
  return (
    <Popover.Root>
      <Popover.Trigger>{children}</Popover.Trigger>
      <PopoverContents>
        <HexAlphaColorPicker color={color} onChange={onChange} />
        <HexColorInput color={color} onChange={onChange} className={style.input} prefixed />
      </PopoverContents>
    </Popover.Root>
  );
}
