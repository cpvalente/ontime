import { debounce } from '../../../../common/utils/debounce';
import PopoverPicker from '../../../../common/components/input/popover-picker/PopoverPicker';
import { IoEyedrop } from '@react-icons/all-files/io5/IoEyedrop';

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
