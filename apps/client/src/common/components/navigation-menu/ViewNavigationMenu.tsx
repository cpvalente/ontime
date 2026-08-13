import { type HotkeyItem, useDisclosure, useHotkeys } from '@mantine/hooks';
import { memo } from 'react';
import { useSearchParams } from 'react-router';

import { hasCustomParams } from '../../stores/savedViewParams';
import { useViewParamsEditorStore } from '../view-params-editor/viewParamsEditor.store';
import FloatingNavigation from './floating-navigation/FloatingNavigation';
import NavigationMenu from './NavigationMenu';
import ViewLockedIcon from './view-locked-icon/ViewLockedIcon';

interface ViewNavigationMenuProps {
  /** prevent navigation */
  isNavigationLocked?: boolean;
  /** prevent showing settings */
  suppressSettings?: boolean;
  suppressSpaceHotkey?: boolean;
}

export default memo(ViewNavigationMenu);
function ViewNavigationMenu({ isNavigationLocked, suppressSettings, suppressSpaceHotkey }: ViewNavigationMenuProps) {
  const [isMenuOpen, menuHandler] = useDisclosure();
  const { open: showEditFormDrawer } = useViewParamsEditorStore();
  const [searchParams] = useSearchParams();
  const hasSavedChanges = hasCustomParams(searchParams);

  // Omitting the binding also avoids useHotkeys preventing the default action.
  const spaceHotkey: HotkeyItem[] = suppressSpaceHotkey
    ? []
    : [
        [
          'Space',
          () => {
            if (isNavigationLocked) return;
            menuHandler.toggle();
          },
          { preventDefault: true },
        ],
      ];

  useHotkeys([
    ...spaceHotkey,
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
