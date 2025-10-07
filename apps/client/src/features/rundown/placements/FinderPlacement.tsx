import { memo } from 'react';
import { useDisclosure, useHotkeys } from '@mantine/hooks';

import Finder from '../../../views/editor/finder/Finder';

export default memo(FinderPlacement);

function FinderPlacement() {
  const [isOpen, handler] = useDisclosure();

  useHotkeys([
    ['mod + f', handler.toggle],
    ['Escape', handler.close],
  ]);

  if (isOpen) {
    return <Finder isOpen={isOpen} onClose={handler.close} />;
  }

  return null;
}
