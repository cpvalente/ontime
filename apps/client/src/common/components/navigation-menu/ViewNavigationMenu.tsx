import { memo } from 'react';
import { useDisclosure } from '@chakra-ui/react';

import FloatingNavigation from './FloatingNavigation';
import NavigationMenu from './NavigationMenu';
import useViewEditor from './useViewEditor';
import ViewLockedIcon from './ViewLockedIcon';

interface ViewNavigationMenuProps {
  isLockable?: boolean;
}

function ViewNavigationMenu(props: ViewNavigationMenuProps) {
  const { isLockable } = props;

  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();
  const { showEditFormDrawer, isViewLocked } = useViewEditor({ isLockable });

  const toggleMenu = () => (isMenuOpen ? onMenuClose() : onMenuOpen());

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

export default memo(ViewNavigationMenu);
