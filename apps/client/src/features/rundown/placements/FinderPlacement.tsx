import { memo } from 'react';
import { useDisclosure } from '@chakra-ui/react';
import { useHotkeys } from '@mantine/hooks';

import Finder from '../../editors/finder/Finder';

export default memo(FinderPlacement);

function FinderPlacement() {
  const { isOpen, onToggle, onClose } = useDisclosure();

  useHotkeys([
    ['mod + f', onToggle],
    ['Escape', onClose],
  ]);

  if (isOpen) {
    return <Finder isOpen={isOpen} onClose={onClose} />;
  }

  return null;
}
