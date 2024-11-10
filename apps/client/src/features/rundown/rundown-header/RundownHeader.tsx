import { Button, ButtonGroup } from '@chakra-ui/react';

import { AppMode, useAppMode } from '../../../common/stores/appModeStore';

import RundownMenu from './RundownMenu';

import style from './RundownHeader.module.scss';

export default function RundownHeader() {
  const appMode = useAppMode((state) => state.mode);
  const setAppMode = useAppMode((state) => state.setMode);

  return (
    <div className={style.header}>
      <ButtonGroup isAttached>
        <Button
          size='sm'
          variant={appMode === AppMode.Run ? 'ontime-filled' : 'ontime-subtle'}
          onClick={() => setAppMode(AppMode.Run)}
        >
          Run
        </Button>
        <Button
          size='sm'
          variant={appMode === AppMode.Edit ? 'ontime-filled' : 'ontime-subtle'}
          onClick={() => setAppMode(AppMode.Edit)}
        >
          Edit
        </Button>
      </ButtonGroup>
      <RundownMenu />
    </div>
  );
}
