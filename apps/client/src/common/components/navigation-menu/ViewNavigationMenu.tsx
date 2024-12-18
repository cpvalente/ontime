import { memo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDisclosure } from '@chakra-ui/react';

import { isStringBoolean } from '../../../features/viewers/common/viewUtils';

import FloatingNavigation from './FloatingNavigation';
import NavigationMenu from './NavigationMenu';
import ViewLockedIcon from './ViewLockedIcon';

function ViewNavigationMenu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { open: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();

  const isViewLocked = isStringBoolean(searchParams.get('locked'));

  const showEditFormDrawer = useCallback(() => {
    searchParams.set('edit', 'true');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

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
