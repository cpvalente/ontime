import { IoEyedrop } from '@react-icons/all-files/io5/IoEyedrop';

import PopoverPicker from '../../../../common/components/input/popover-picker/PopoverPicker';
import { debounce } from '../../../../common/utils/debounce';

interface SwatchPickerProps {
  color: string;
  onChange: (name: string) => void;
}

export default function SwatchPicker(props: SwatchPickerProps) {
  const { color, onChange } = props;

  const debouncedChange = debounce((value: string) => {
    onChange(value);
  }, 250);

  return <PopoverPicker color={color} onChange={debouncedChange} icon={<IoEyedrop />} hasInput />;
}
