import { HexAlphaColorPicker } from 'react-colorful';
import { useController, UseControllerProps } from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from '@chakra-ui/react';
import { ViewSettings } from 'ontime-types';

import style from './PopoverPicker.module.scss';

export function PopoverPickerRHF(props: UseControllerProps<ViewSettings>) {
  const { name, control } = props;
  const {
    field: { onChange, value },
  } = useController({ control, name });

  return <PopoverPicker color={value as string} onChange={onChange} />;
}

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
