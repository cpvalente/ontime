import { HexAlphaColorPicker, HexColorInput } from 'react-colorful';
import { useController, UseControllerProps } from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from '@chakra-ui/react';
import { ViewSettings } from 'ontime-types';

import style from './PopoverPicker.module.scss';
import { ReactNode } from 'react';

export function PopoverPickerRHF(props: UseControllerProps<ViewSettings>) {
  const { name, control } = props;
  const {
    field: { onChange, value },
  } = useController({ control, name });

  return <PopoverPicker color={value as string} onChange={onChange} />;
}

interface PopoverPickerProps {
  color: string;
  icon?: ReactNode;
  hasInput?: boolean;
  onChange: (color: string) => void;
}

export default function PopoverPicker(props: PopoverPickerProps) {
  const { color, icon, hasInput, onChange } = props;

  return (
    <Popover>
      <PopoverTrigger>
        {icon ? (
          <div className={style.icon}>{icon}</div>
        ) : (
          <div className={style.swatch} style={{ backgroundColor: color }} />
        )}
      </PopoverTrigger>
      <PopoverContent style={{ width: 'auto' }}>
        <HexAlphaColorPicker color={color} onChange={onChange} />
        {hasInput && <HexColorInput color={color} onChange={onChange} className={style.colorInput} prefixed />}
      </PopoverContent>
    </Popover>
  );
}
