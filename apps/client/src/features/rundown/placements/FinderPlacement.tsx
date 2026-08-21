import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { memo } from 'react';

import Finder from '../../../views/editor/finder/Finder';

export default memo(FinderPlacement);

function FinderPlacement() {
  const [isOpen, handler] = useDisclosure();

  /**
   * The empty tagsToIgnore is significant: by default the hook skips input elements,
   * which would make the shortcut dead while editing an entry.
   *
   * This opens rather than toggles. Toggling on a key that also mounts and unmounts the
   * dialog races against it, and browsers treat a repeated find shortcut as "focus the
   * search again" rather than "close it". The finder selects its input instead, and
   * Escape closes.
   */
  useHotkeys([['mod + f', handler.open, { preventDefault: true }]], []);

  if (isOpen) {
    return <Finder isOpen={isOpen} onClose={handler.close} />;
  }

  return null;
}
