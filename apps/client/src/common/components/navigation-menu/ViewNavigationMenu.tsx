import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { memo } from 'react';
import { useSearchParams } from 'react-router';

import { hasCustomParams, useSavedViewParams } from '../../stores/savedViewParams';
import { useViewParamsEditorStore } from '../view-params-editor/viewParamsEditor.store';
import FloatingNavigation from './floating-navigation/FloatingNavigation';
import NavigationMenu from './NavigationMenu';
import ViewLockedIcon from './view-locked-icon/ViewLockedIcon';

interface ViewNavigationMenuProps {
  /** prevent navigation */
  isNavigationLocked?: boolean;
  /** prevent showing settings */
  suppressSettings?: boolean;
}

export default memo(ViewNavigationMenu);
function ViewNavigationMenu({ isNavigationLocked, suppressSettings }: ViewNavigationMenuProps) {
  const [isMenuOpen, menuHandler] = useDisclosure();
  const { open: showEditFormDrawer } = useViewParamsEditorStore();
  const [searchParams] = useSearchParams();
  const savedParams = useSavedViewParams((store) => store.params);
  const hasSavedChanges = hasCustomParams(searchParams) || Object.keys(savedParams).length > 0;

  useHotkeys([
    [
      'Space',
      () => {
        if (isNavigationLocked) return;
        menuHandler.toggle();
      },
      { preventDefault: true },
    ],
    [
      'mod + ,',
      () => {
        if (suppressSettings) return;
        showEditFormDrawer();
      },
      { preventDefault: true },
    ],
  ]);

  if (isNavigationLocked && suppressSettings) {
    return <ViewLockedIcon />;
  }

  return (
    <>
      <FloatingNavigation
        toggleMenu={isNavigationLocked ? undefined : menuHandler.toggle}
        toggleSettings={suppressSettings ? undefined : showEditFormDrawer}
        hasSavedChanges={hasSavedChanges}
      />
      {!isNavigationLocked && <NavigationMenu isOpen={isMenuOpen} onClose={menuHandler.close} />}
    </>
  );
}
