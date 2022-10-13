import { memo, useCallback, useContext } from 'react';
import { ButtonGroup, HStack } from '@chakra-ui/react';
import { FiTarget } from '@react-icons/all-files/fi/FiTarget';
import { IoCaretDown } from '@react-icons/all-files/io5/IoCaretDown';
import { IoCaretUp } from '@react-icons/all-files/io5/IoCaretUp';
import TooltipActionBtn from 'common/components/buttons/TooltipActionBtn';
import { CursorContext } from 'common/context/CursorContext';
import { useEventAction } from 'common/hooks/useEventAction';

import MenuActionButtons from './MenuActionButtons';

import style from './EventListMenu.module.css';

const EventListMenu = () => {
  const { isCursorLocked, toggleCursorLocked, moveCursorUp, moveCursorDown } =
    useContext(CursorContext);
  const { addEvent, deleteAllEvents } = useEventAction();

  const actionHandler = useCallback(
    (action) => {
      switch (action) {
        case 'event':
          addEvent({ type: action });
          break;
        case 'delay':
          addEvent({ type: action });
          break;
        case 'block':
          addEvent({ type: action });
          break;
        case 'cursorUp':
          moveCursorUp();
          break;
        case 'cursorDown':
          moveCursorDown();
          break;
        case 'togglelock':
          toggleCursorLocked();
          break;
        case 'deleteall':
          deleteAllEvents();
          break;
        default:
          break;
      }
    },
    [addEvent, deleteAllEvents, moveCursorDown, moveCursorUp, toggleCursorLocked]
  );

  const collapsingBtnProps = {
    variant: 'outline',
    size: 'sm',
  };

  const cursorBtnProps = {
    size: 'sm',
    color: 'pink.300',
    borderColor: 'pink.300',
    variant: 'outline',
  };

  return (
    <HStack className={style.headerButtons}>
      <ButtonGroup isAttached>
        <TooltipActionBtn
          {...cursorBtnProps}
          clickHandler={() => actionHandler('cursorUp')}
          icon={<IoCaretUp />}
          tooltip='Move cursor up Alt + ↑'
          _hover={{ bg: 'pink.400', color: 'white' }}
        />
        <TooltipActionBtn
          {...cursorBtnProps}
          clickHandler={() => actionHandler('cursorDown')}
          icon={<IoCaretDown />}
          tooltip='Move cursor down Alt + ↓'
          _hover={{ bg: 'pink.400', color: 'white' }}
        />
        <TooltipActionBtn
          {...cursorBtnProps}
          clickHandler={() => actionHandler('togglelock')}
          icon={<FiTarget />}
          tooltip='Lock cursor to current'
          width='3em'
          backgroundColor={isCursorLocked && 'pink.400'}
          color={isCursorLocked && 'white'}
          _hover={{ bg: 'pink.400', color: 'white' }}
          variant={isCursorLocked ? 'solid' : 'outline'}
        />
      </ButtonGroup>
      <MenuActionButtons actionHandler={actionHandler} size='sm' />
    </HStack>
  );
};

export default memo(EventListMenu);
