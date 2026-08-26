import { useHotkeys } from '@mantine/hooks';
import { memo, useCallback, useState } from 'react';
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
  /** leave Space to the view, which needs it for its own transport */
  suppressSpaceHotkey?: boolean;
}

function isInteractiveKeyboardAction(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.closest(
      'button, a, input, textarea, select, [role="button"], [role="checkbox"], [role="switch"], [contenteditable]:not([contenteditable="false"])',
    ) !== null
  );
}

export default memo(ViewNavigationMenu);
function ViewNavigationMenu({ isNavigationLocked, suppressSettings, suppressSpaceHotkey }: ViewNavigationMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { open: showEditFormDrawer } = useViewParamsEditorStore();
  const [searchParams] = useSearchParams();
  const hasSavedChanges = hasCustomParams(searchParams);

  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useHotkeys([
    [
      'Space',
      (event) => {
        if (suppressSpaceHotkey || isNavigationLocked || isInteractiveKeyboardAction(event.target)) return;
        event.preventDefault();
        toggleMenu();
      },
      { preventDefault: false },
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
        toggleMenu={isNavigationLocked ? undefined : toggleMenu}
        toggleSettings={suppressSettings ? undefined : showEditFormDrawer}
        hasSavedChanges={hasSavedChanges}
      />
      {!isNavigationLocked && <NavigationMenu isOpen={isMenuOpen} onClose={closeMenu} />}
    </>
  );
}
