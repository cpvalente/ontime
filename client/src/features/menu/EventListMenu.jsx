import { memo, useContext } from 'react';
import { Divider } from '@chakra-ui/react';
import { CursorContext } from '../../app/context/CursorContext';
import MenuActionButtons from './MenuActionButtons';
import CollapseBtn from 'common/components/buttons/CollapseBtn';
import CursorUpBtn from '../../common/components/buttons/CursorUpBtn';
import CursorDownBtn from '../../common/components/buttons/CursorDownBtn';
import CursorLockedBtn from 'common/components/buttons/CursorLockedBtn';
import style from './EventListMenu.module.css';

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
    <div className={style.headerButtons}>
      <CollapseBtn size='sm' clickhandler={() => eventsHandler('collapseall')} />
      <Divider orientation='vertical' />
      <CursorUpBtn size='sm' clickhandler={() => actionHandler('cursorUp')} />
      <CursorDownBtn size='sm' clickhandler={() => actionHandler('cursorDown')} />
      <CursorLockedBtn
        size='sm'
        clickhandler={() => actionHandler('togglelock')}
        active={isCursorLocked}
      />
      <Divider orientation='vertical' />
      <MenuActionButtons actionHandler={actionHandler} size='sm' />
    </div>
  );
};

export default memo(EventListMenu);
