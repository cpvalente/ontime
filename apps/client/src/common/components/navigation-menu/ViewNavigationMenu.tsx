import { memo } from 'react';
import { useDisclosure } from '@chakra-ui/react';
import { useHotkeys } from '@mantine/hooks';

import FloatingNavigation from './FloatingNavigation';
import NavigationMenu from './NavigationMenu';
import useViewEditor from './useViewEditor';
import ViewLockedIcon from './ViewLockedIcon';

interface ViewNavigationMenuProps {
  isLockable?: boolean;
}

export default memo(ViewNavigationMenu);
function ViewNavigationMenu({ isLockable }: ViewNavigationMenuProps) {
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
        if (isViewLocked) return;
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
      <FloatingNavigation toggleMenu={toggleMenu} toggleSettings={showEditFormDrawer} />
      <NavigationMenu isOpen={isMenuOpen} onClose={onMenuClose} />
    </>
  );
}
