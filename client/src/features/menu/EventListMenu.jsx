import React, { memo, useCallback, useContext } from 'react';
import { ButtonGroup, Divider, HStack } from '@chakra-ui/react';
import { CursorContext } from '../../app/context/CursorContext';
import { FiChevronsUp } from '@react-icons/all-files/fi/FiChevronsUp';
import { FiChevronsDown } from '@react-icons/all-files/fi/FiChevronsDown';
import { FiTarget } from '@react-icons/all-files/fi/FiTarget';
import { IoCaretUp } from '@react-icons/all-files/io5/IoCaretUp';
import { IoCaretDown } from '@react-icons/all-files/io5/IoCaretDown';
import TooltipActionBtn from '../../common/components/buttons/TooltipActionBtn';
import MenuActionButtons from './MenuActionButtons';
import PropTypes from 'prop-types';
import style from './EventListMenu.module.css';

const EventListMenu = ({ eventsHandler }) => {
  const { isCursorLocked, toggleCursorLocked, moveCursorUp, moveCursorDown } =
    useContext(CursorContext);

  const actionHandler = useCallback(
    (action) => {
      switch (action) {
        case 'event':
          eventsHandler('add', { type: action, order: 0 });
          break;
        case 'delay':
          eventsHandler('add', { type: action, order: 0 });
          break;
        case 'block':
          eventsHandler('add', { type: action, order: 0 });
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
          eventsHandler('deleteall');
          break;
        default:
          break;
      }
    },
    [eventsHandler, moveCursorDown, moveCursorUp, toggleCursorLocked]
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
          clickHandler={() => eventsHandler('expandall')}
          icon={<FiChevronsDown />}
          tooltip='Expand All'
          {...collapsingBtnProps}
        />
        <TooltipActionBtn
          clickHandler={() => eventsHandler('collapseall')}
          icon={<FiChevronsUp />}
          tooltip='Collapse All'
          {...collapsingBtnProps}
        />
      </ButtonGroup>
      <Divider orientation='vertical' />
      <ButtonGroup isAttached>
        <TooltipActionBtn
          {...cursorBtnProps}
          clickHandler={() => actionHandler('cursorUp')}
          icon={<IoCaretUp />}
          tooltip='Move cursor up Alt + ↑'
        />
        <TooltipActionBtn
          {...cursorBtnProps}
          clickHandler={() => actionHandler('cursorDown')}
          icon={<IoCaretDown />}
          tooltip='Move cursor down Alt + ↓'
        />
        <TooltipActionBtn
          {...cursorBtnProps}
          clickHandler={() => actionHandler('togglelock')}
          icon={<FiTarget />}
          tooltip='Lock cursor to current'
          width='3em'
          backgroundColor={isCursorLocked && 'pink.400'}
          variant={isCursorLocked ? 'solid' : 'outline'}
        />
      </ButtonGroup>
      <Divider orientation='vertical' />
      <MenuActionButtons actionHandler={actionHandler} size='sm' />
    </HStack>
  );
};

export default memo(EventListMenu);

EventListMenu.propTypes = {
  eventsHandler: PropTypes.func,
};
