import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDisclosure } from '@chakra-ui/react';

import FloatingNavigation from '../../common/components/navigation-menu/FloatingNavigation';
import ProductionNavigationMenu from '../../common/components/navigation-menu/ProductionNavigationMenu';
import ProtectRoute from '../../common/components/protect-route/ProtectRoute';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';

import { cuesheetOptions, persistParams } from './cuesheet.options';
import CuesheetPage from './CuesheetPage';

export default function ProtectedCuesheet() {
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
      <ViewParamsEditor viewOptions={cuesheetOptions} onSubmitCb={persistParams} />
      <CuesheetPage />
    </ProtectRoute>
  );
}
