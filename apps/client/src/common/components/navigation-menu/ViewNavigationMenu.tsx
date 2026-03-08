import { useDisclosure, useHotkeys } from '@mantine/hooks';
import { memo } from 'react';

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
      />
      {!isNavigationLocked && <NavigationMenu isOpen={isMenuOpen} onClose={menuHandler.close} />}
    </>
  );
}
