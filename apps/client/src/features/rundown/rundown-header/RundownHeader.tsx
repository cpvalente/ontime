import { Button, ButtonGroup } from '@chakra-ui/react';

import { useEventAction } from '../../../common/hooks/useEventAction';
import { AppMode, useAppMode } from '../../../common/stores/appModeStore';

import RundownMenu from './RundownMenu';

import style from './RundownHeader.module.scss';

export default function RundownHeader() {
  const { toggleFreezeEvents } = useEventAction();

  const appMode = useAppMode((state) => state.mode);
  const setAppMode = useAppMode((state) => state.setMode);

  const toggleAppMode = async (appMode: AppMode) => {
    if (appMode === AppMode.Freeze) {
      await toggleFreezeEvents(true);
    } else {
      await toggleFreezeEvents(false);
    }
    setAppMode(appMode);
  };

  const setRunMode = () => toggleAppMode(AppMode.Run);
  const setEditMode = () => toggleAppMode(AppMode.Edit);
  const setFreezeMode = () => toggleAppMode(AppMode.Freeze);

  return (
    <div className={style.header}>
      <ButtonGroup isAttached>
        <Button size='sm' variant={appMode === AppMode.Run ? 'ontime-filled' : 'ontime-subtle'} onClick={setRunMode}>
          Run
        </Button>
        <Button size='sm' variant={appMode === AppMode.Edit ? 'ontime-filled' : 'ontime-subtle'} onClick={setEditMode}>
          Edit
        </Button>
        <Button
          size='sm'
          variant={appMode === AppMode.Freeze ? 'ontime-filled' : 'ontime-subtle'}
          onClick={setFreezeMode}
        >
          Freeze
        </Button>
      </ButtonGroup>
      <RundownMenu />
    </div>
  );
}
