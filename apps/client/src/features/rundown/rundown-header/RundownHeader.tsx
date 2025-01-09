import { Group } from '@chakra-ui/react';

import { Button } from '../../../common/components/ui/button';
import { AppMode, useAppMode } from '../../../common/stores/appModeStore';

import RundownMenu from './RundownMenu';

import style from './RundownHeader.module.scss';

export default function RundownHeader() {
  const appMode = useAppMode((state) => state.mode);
  const setAppMode = useAppMode((state) => state.setMode);
  const setRunMode = () => setAppMode(AppMode.Run);
  const setEditMode = () => setAppMode(AppMode.Edit);

  return (
    <div className={style.header}>
      <Group attached>
        <Button
          size='xs'
          fontSize='sm'
          variant={appMode === AppMode.Run ? 'ontime-filled' : 'ontime-subtle'}
          onClick={setRunMode}
        >
          Run
        </Button>
        <Button
          size='xs'
          fontSize='sm'
          variant={appMode === AppMode.Edit ? 'ontime-filled' : 'ontime-subtle'}
          onClick={setEditMode}
        >
          Edit
        </Button>
      </Group>
      <RundownMenu />
    </div>
  );
}
