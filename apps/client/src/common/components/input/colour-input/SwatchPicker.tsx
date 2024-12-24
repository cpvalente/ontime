import { useCallback } from 'react';
import { IoEyedrop } from '@react-icons/all-files/io5/IoEyedrop';
import Color from 'color';

import PopoverPicker from '../../../../common/components/input/popover-picker/PopoverPicker';
import { debounce } from '../../../../common/utils/debounce';
import { cx } from '../../../utils/styleUtils';

import style from './SwatchSelect.module.scss';

interface SwatchPickerProps {
  color: string;
  isSelected?: boolean;
  onChange: (name: string) => void;
}

export default function SwatchPicker(props: SwatchPickerProps) {
  const { color, onChange, isSelected } = props;

  const classes = cx([style.swatch, isSelected ? style.selected : null, style.selectable]);

  const iconColor = Color(color).isLight() && isSelected ? '#000000' : '#FFFFFF';

  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      onChange(newValue);
    }, 500),
    [onChange],
  );

  return (
    <div className={classes}>
      <PopoverPicker
        color={isSelected ? color : ''}
        onChange={debouncedOnChange}
        icon={<IoEyedrop color={iconColor} />}
        hasInput
      />
    </div>
  );
}
