import { useCallback, useEffect, useState } from 'react';
import { IoEyedrop } from '@react-icons/all-files/io5/IoEyedrop';

import PopoverPicker from '../../../../common/components/input/popover-picker/PopoverPicker';
import { debounce } from '../../../../common/utils/debounce';

interface SwatchPickerProps {
  color: string;
  onChange: (name: string) => void;
}

export default function SwatchPicker(props: SwatchPickerProps) {
  const { color, onChange } = props;
  const [value, setValue] = useState(color);

  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      onChange(newValue);
    }, 500),
    [onChange],
  );

  useEffect(() => {
    debouncedOnChange(value);
  }, [value, debouncedOnChange]);

  return <PopoverPicker color={value} onChange={setValue} icon={<IoEyedrop />} hasInput />;
}
