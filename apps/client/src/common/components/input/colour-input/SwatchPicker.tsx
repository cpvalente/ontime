import { useCallback } from 'react';
import { IoEyedrop } from '@react-icons/all-files/io5/IoEyedrop';

import PopoverPicker from '../../../../common/components/input/popover-picker/PopoverPicker';
import { debounce } from '../../../../common/utils/debounce';
import { cx } from '../../../utils/styleUtils';

import style from './SwatchSelect.module.scss';

interface SwatchPickerProps {
  color: string;
  isSelected?: boolean;
  onChange: (name: string) => void;
}

function isLightColor(color: string) {
  const hex = color.replace('#', '');
  const c_r = parseInt(hex.substring(0, 0 + 2), 16);
  const c_g = parseInt(hex.substring(2, 2 + 2), 16);
  const c_b = parseInt(hex.substring(4, 4 + 2), 16);
  const brightness = (c_r * 299 + c_g * 587 + c_b * 114) / 1000;
  return brightness > 155;
}

export default function SwatchPicker(props: SwatchPickerProps) {
  const { color, onChange, isSelected } = props;

  const classes = cx([style.swatch, isSelected ? style.selected : null, style.selectable]);

  const iconColor = isLightColor(color) && isSelected ? '#000000' : '#FFFFFF';

  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      onChange(newValue);
    }, 500),
    [onChange],
  );

  return (
    <div className={`${classes}`}>
      <PopoverPicker
        color={isSelected ? color : ''}
        onChange={debouncedOnChange}
        icon={<IoEyedrop color={iconColor} />}
        hasInput
      />
    </div>
  );
}
