import React, { memo, useCallback, useContext } from 'react';
import { ButtonGroup, HStack } from '@chakra-ui/react';
import { FiChevronsDown } from '@react-icons/all-files/fi/FiChevronsDown';
import { FiChevronsUp } from '@react-icons/all-files/fi/FiChevronsUp';
import { FiTarget } from '@react-icons/all-files/fi/FiTarget';
import { IoCaretDown } from '@react-icons/all-files/io5/IoCaretDown';
import { IoCaretUp } from '@react-icons/all-files/io5/IoCaretUp';
import PropTypes from 'prop-types';

import TooltipActionBtn from '../../common/components/buttons/TooltipActionBtn';
import { CursorContext } from '../../common/context/CursorContext';

import MenuActionButtons from './MenuActionButtons';

import style from './EventListMenu.module.css';

const EventListMenu = ({ eventsHandler }) => {
  const { isCursorLocked, toggleCursorLocked, moveCursorUp, moveCursorDown } =
    useContext(CursorContext);

  const actionHandler = useCallback(
    (action) => {
      switch (action) {
        case 'event':
          eventsHandler('add', { type: action });
          break;
        case 'delay':
          eventsHandler('add', { type: action });
          break;
        case 'block':
          eventsHandler('add', { type: action });
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
          _hover={{ bg: '#ebedf0', color: '#333' }}
          {...collapsingBtnProps}
        />
        <TooltipActionBtn
          clickHandler={() => eventsHandler('collapseall')}
          icon={<FiChevronsUp />}
          tooltip='Collapse All'
          _hover={{ bg: '#ebedf0', color: '#333' }}
          {...collapsingBtnProps}
        />
      </ButtonGroup>
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

EventListMenu.propTypes = {
  eventsHandler: PropTypes.func,
};
