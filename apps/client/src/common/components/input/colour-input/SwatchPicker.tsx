import { useCallback } from 'react';
import { useController, UseControllerProps } from 'react-hook-form';
import { IoEyedrop } from '@react-icons/all-files/io5/IoEyedrop';
import { ViewSettings } from 'ontime-types';

import { debounce } from '../../../utils/debounce';
import { cx, getAccessibleColour } from '../../../utils/styleUtils';
import PopoverPicker from '../popover-picker/PopoverPicker';

import style from './SwatchSelect.module.scss';

interface SwatchPickerProps {
  color: string;
  isSelected?: boolean;
  onChange: (name: string) => void;
  alwaysDisplayColor?: boolean;
}

export default function SwatchPicker(props: SwatchPickerProps) {
  const { color, onChange, isSelected, alwaysDisplayColor } = props;

  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      onChange(newValue);
    }, 500),
    [onChange],
  );

  const displayColor = alwaysDisplayColor || isSelected ? color : '';
  const { color: iconColor } = getAccessibleColour(displayColor);

  return (
    <PopoverPicker color={displayColor} onChange={debouncedOnChange}>
      <div
        className={cx([style.swatch, isSelected && style.selected, style.selectable])}
        style={{ backgroundColor: displayColor }}
      >
        <IoEyedrop color={iconColor} />
      </div>
    </PopoverPicker>
  );
}

export function SwatchPickerRHF(props: UseControllerProps<ViewSettings>) {
  const { name, control } = props;
  const {
    field: { onChange, value },
  } = useController({ control, name });

  const displayColor = typeof value === 'string' ? value : '';
  const { color: iconColor } = getAccessibleColour(displayColor);

  return (
    <PopoverPicker color={value as string} onChange={onChange}>
      <div className={cx([style.swatch, style.selectable])} style={{ backgroundColor: displayColor }}>
        <IoEyedrop color={iconColor} />
      </div>
    </PopoverPicker>
  );
}
