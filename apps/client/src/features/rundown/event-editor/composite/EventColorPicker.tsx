import { debounceWithValue } from '../../../../common/utils/debounce';
import PopoverPicker from '../../../../common/components/input/popover-picker/PopoverPicker';
import style from './EventColorPicker.module.scss';
import { ReactNode, useCallback } from 'react';

interface EventColorPickerProps {
  name: 'colour';
  value: string;
  icon: ReactNode;
  handleChange: (newValue: 'colour', name: string) => void;
}

export default function EventColorPicker(props: EventColorPickerProps) {
  const { name, value, icon, handleChange } = props;

  const debouncedChange = debounceWithValue((value: string) => {
    setColour(value);
  }, 250);

  const setColour = useCallback(
    (newValue: string) => {
      if (newValue !== value) {
        handleChange(name, newValue);
      }
    },
    [handleChange, name, value],
  );

  return (
    <div className={style.inline}>
      <PopoverPicker color={value} onChange={debouncedChange} icon={icon} hasInput={true} />
      <input type='hidden' name={name} value={value} />
    </div>
  );
}
