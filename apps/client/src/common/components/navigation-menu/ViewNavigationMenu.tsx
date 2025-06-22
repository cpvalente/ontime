import { memo } from 'react';
import { useDisclosure } from '@chakra-ui/react';
import { useHotkeys } from '@mantine/hooks';

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
  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();
  const { showEditFormDrawer, isViewLocked } = useViewEditor({ isLockable });

  const toggleMenu = () => (isMenuOpen ? onMenuClose() : onMenuOpen());

  useHotkeys([
    [
      'Space',
      () => {
        if (isViewLocked) return;
        toggleMenu();
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
        toggleMenu={toggleMenu}
        toggleSettings={supressSettings ? undefined : () => showEditFormDrawer()}
      />
      <NavigationMenu isOpen={isMenuOpen} onClose={onMenuClose} />
    </>
  );
}
