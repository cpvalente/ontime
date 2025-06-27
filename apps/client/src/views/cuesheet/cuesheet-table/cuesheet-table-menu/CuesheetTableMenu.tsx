import { memo } from 'react';
import { Menu, MenuButton, Portal } from '@chakra-ui/react';

import CuesheetTableMenuActionsProps from './CuesheetTableMenuActions';
import { useCuesheetTableMenu } from './useCuesheetTableMenu';

interface CuesheetTableMenuProps {
  showModal: (eventId: string) => void;
}

export default memo(CuesheetTableMenu);

function CuesheetTableMenu({ showModal }: CuesheetTableMenuProps) {
  const { isOpen, eventId, entryIndex, position, closeMenu } = useCuesheetTableMenu();

  return (
    <Portal>
      {isOpen && (
        <Menu isOpen size='sm' onClose={closeMenu} isLazy variant='ontime-on-dark'>
          <MenuButton
            position='absolute'
            left={position.x}
            top={position.y}
            pointerEvents='none'
            aria-hidden
            w={1}
            h={1}
          />
          <CuesheetTableMenuActionsProps eventId={eventId} entryIndex={entryIndex} showModal={showModal} />
        </Menu>
      )}
    </Portal>
  );
}
