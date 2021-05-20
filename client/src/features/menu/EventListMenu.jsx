import { memo, useMemo } from 'react';
import { Divider } from '@chakra-ui/react';
import style from './EventListMenu.module.css';
import MenuActionButtons from './MenuActionButtons';
import CollapseBtn from 'common/components/buttons/CollapseBtn';
import ExpandBtn from 'common/components/buttons/ExpandBtn';
import { SelectSetting, HandleOptions } from 'app/context/settingsAtom';
import { useAtom } from 'jotai';
import LockIconBtn from 'common/components/buttons/LockIconBtn';

const EventListMenu = ({ eventsHandler }) => {
  const [cursorSettings] = useAtom(useMemo(() => SelectSetting('cursor'), []));
  const [, SetOption] = useAtom(HandleOptions);

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
      case 'togglelock':
        let newSet = 'locked';
        if (cursorSettings === 'locked') {
          newSet = 'unlocked';
        }
        SetOption({ cursor: newSet });
        break;
      default:
        break;
    }
  };

  return (
    <div className={style.headerButtons}>
      <CollapseBtn
        size='sm'
        clickhandler={() => eventsHandler('collapseall')}
      />
      <ExpandBtn size='sm' clickhandler={() => eventsHandler('expandall')} />
      <Divider orientation='vertical' />
      <LockIconBtn
        size='sm'
        clickhandler={() => actionHandler('togglelock')}
        active={cursorSettings === 'locked'}
      />
      <Divider orientation='vertical' />
      <MenuActionButtons actionHandler={actionHandler} size='sm' />
    </div>
  );
};

export default memo(EventListMenu);
