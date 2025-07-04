import { memo } from 'react';
import { useDisclosure, useHotkeys } from '@mantine/hooks';

import FloatingNavigation from './floating-navigation/FloatingNavigation';
import ViewLockedIcon from './view-locked-icon/ViewLockedIcon';
import NavigationMenu from './NavigationMenu';
import useViewEditor from './useViewEditor';

interface ViewNavigationMenuProps {
  isLockable?: boolean;
  supressSettings?: boolean;
}

export default memo(ViewNavigationMenu);
function ViewNavigationMenu({ isLockable, supressSettings }: ViewNavigationMenuProps) {
  const [isMenuOpen, menuHandler] = useDisclosure();
  const { showEditFormDrawer, isViewLocked } = useViewEditor({ isLockable });

  useHotkeys([
    [
      'Space',
      () => {
        if (isViewLocked) return;
        menuHandler.toggle();
      },
      { preventDefault: true },
    ],
    [
      'mod + ,',
      () => {
        if (isViewLocked || supressSettings) return;
        showEditFormDrawer();
      },
      { preventDefault: true },
    ],
  ]);

  if (isViewLocked) {
    return <ViewLockedIcon />;
  }

  return (
    <>
      <FloatingNavigation
        toggleMenu={menuHandler.toggle}
        toggleSettings={supressSettings ? undefined : () => showEditFormDrawer()}
      />
      <NavigationMenu isOpen={isMenuOpen} onClose={menuHandler.close} />
    </>
  );
}
