import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDisclosure } from '@chakra-ui/react';

import FloatingNavigation from '../../common/components/navigation-menu/FloatingNavigation';
import ProductionNavigationMenu from '../../common/components/navigation-menu/ProductionNavigationMenu';
import ProtectRoute from '../../common/components/protect-route/ProtectRoute';

import Operator from './Operator';

export default function OperatorExport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const showEditFormDrawer = useCallback(() => {
    searchParams.set('edit', 'true');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const toggleMenu = isOpen ? onClose : onOpen;

  return (
    <ProtectRoute permission='operator'>
      <FloatingNavigation toggleMenu={toggleMenu} toggleSettings={showEditFormDrawer} />
      <ProductionNavigationMenu isMenuOpen={isOpen} onMenuClose={onClose} />
      <Operator />
    </ProtectRoute>
  );
}
