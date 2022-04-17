import React, { memo, useContext } from 'react';
import { ButtonGroup, Divider, HStack } from '@chakra-ui/react';
import { CursorContext } from '../../app/context/CursorContext';
import MenuActionButtons from './MenuActionButtons';
import CollapseBtn from 'common/components/buttons/CollapseBtn';
import CursorUpBtn from '../../common/components/buttons/CursorUpBtn';
import CursorDownBtn from '../../common/components/buttons/CursorDownBtn';
import CursorLockedBtn from 'common/components/buttons/CursorLockedBtn';
import style from './EventListMenu.module.css';
import ExpandBtn from '../../common/components/buttons/ExpandBtn';

const EventListMenu = ({ eventsHandler }) => {
  const { isCursorLocked, toggleCursorLocked, moveCursorUp, moveCursorDown } =
    useContext(CursorContext);

  const actionHandler = (action) => {
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
  };

  return (
    <HStack className={style.headerButtons}>
      <ButtonGroup isAttached>
        <ExpandBtn size='sm' clickhandler={() => eventsHandler('expandall')} />
        <CollapseBtn size='sm' clickhandler={() => eventsHandler('collapseall')} />
      </ButtonGroup>
      <Divider orientation='vertical' />
      <ButtonGroup isAttached>
        <CursorUpBtn size='sm' clickhandler={() => actionHandler('cursorUp')} />
        <CursorDownBtn size='sm' clickhandler={() => actionHandler('cursorDown')} />
        <CursorLockedBtn
          size='sm'
          clickhandler={() => actionHandler('togglelock')}
          active={isCursorLocked}
          width='3em'
        />
      </ButtonGroup>
      <Divider orientation='vertical' />
      <MenuActionButtons actionHandler={actionHandler} size='sm' />
    </HStack>
  );
};

export default memo(EventListMenu);
