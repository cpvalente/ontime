import { memo } from 'react';
import { useDisclosure, useHotkeys } from '@mantine/hooks';

import { useViewParamsEditorStore } from '../view-params-editor/viewParamsEditor.store';

import FloatingNavigation from './floating-navigation/FloatingNavigation';
import ViewLockedIcon from './view-locked-icon/ViewLockedIcon';
import NavigationMenu from './NavigationMenu';

interface ViewNavigationMenuProps {
  /** prevent navigation and settings*/
  isViewLocked?: boolean;
  /** prevent showing settings */
  suppressSettings?: boolean;
}

export default memo(ViewNavigationMenu);
function ViewNavigationMenu({ isViewLocked, suppressSettings }: ViewNavigationMenuProps) {
  const [isMenuOpen, menuHandler] = useDisclosure();
  const { open: showEditFormDrawer } = useViewParamsEditorStore();

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
        if (isViewLocked || suppressSettings) return;
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
        toggleSettings={suppressSettings ? undefined : () => showEditFormDrawer()}
      />
      <NavigationMenu isOpen={isMenuOpen} onClose={menuHandler.close} />
    </>
  );
}
