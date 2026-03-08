import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { memo } from 'react';

import Finder from '../../../views/editor/finder/Finder';

export default memo(FinderPlacement);

function FinderPlacement() {
  const [isOpen, handler] = useDisclosure();

  useHotkeys([
    ['mod + f', handler.toggle, { preventDefault: true }],
    ['Escape', handler.close, { preventDefault: true }],
  ]);

  if (isOpen) {
    return <Finder isOpen={isOpen} onClose={handler.close} />;
  }

  return null;
}
