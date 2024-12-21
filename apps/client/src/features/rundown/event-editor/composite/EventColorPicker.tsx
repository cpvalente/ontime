import { debounceWithValue } from '../../../../common/utils/debounce';
import PopoverPicker from '../../../../common/components/input/popover-picker/PopoverPicker';
import { useCallback } from 'react';
import { IoEyedrop } from '@react-icons/all-files/io5/IoEyedrop';

interface EventColorPickerProps {
  name: 'colour';
  value: string;
  handleChange: (newValue: 'colour', name: string) => void;
}

export default function EventColorPicker(props: EventColorPickerProps) {
  const { name, value, handleChange } = props;

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

  return <PopoverPicker color={value} onChange={debouncedChange} icon={<IoEyedrop />} hasInput />;
}
