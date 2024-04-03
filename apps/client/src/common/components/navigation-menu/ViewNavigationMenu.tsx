import { memo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDisclosure } from '@chakra-ui/react';

import FloatingNavigation from './FloatingNavigation';
import NavigationMenu from './NavigationMenu';

function ViewNavigationMenu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();

  const showEditFormDrawer = useCallback(() => {
    searchParams.set('edit', 'true');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const toggleMenu = () => (isMenuOpen ? onMenuClose() : onMenuOpen());

  return (
    <>
      <FloatingNavigation toggleMenu={toggleMenu} toggleSettings={showEditFormDrawer} />
      <NavigationMenu isOpen={isMenuOpen} onClose={onMenuClose} />
    </>
  );
}

export default memo(ViewNavigationMenu);
