import { Button, ButtonGroup } from '@chakra-ui/react';
import { OffsetMode } from 'ontime-types';

import { setOffsetMode, useOffsetMode } from '../../../common/hooks/useSocket';
import { AppMode, useAppMode } from '../../../common/stores/appModeStore';

import RundownMenu from './RundownMenu';

import style from './RundownHeader.module.scss';

export default function RundownHeader() {
  const appMode = useAppMode((state) => state.mode);
  const setAppMode = useAppMode((state) => state.setMode);
  const setRunMode = () => setAppMode(AppMode.Run);
  const setEditMode = () => setAppMode(AppMode.Edit);

  const { offsetMode } = useOffsetMode();

  return (
    <div className={style.header}>
      <ButtonGroup isAttached>
        <Button size='sm' variant={appMode === AppMode.Run ? 'ontime-filled' : 'ontime-subtle'} onClick={setRunMode}>
          Run
        </Button>
        <Button size='sm' variant={appMode === AppMode.Edit ? 'ontime-filled' : 'ontime-subtle'} onClick={setEditMode}>
          Edit
        </Button>
      </ButtonGroup>
      <ButtonGroup isAttached>
        <Button
          size='sm'
          variant={offsetMode === OffsetMode.Absolute ? 'ontime-filled' : 'ontime-subtle'}
          onClick={() => setOffsetMode(OffsetMode.Absolute)}
        >
          Absolute
        </Button>
        <Button
          size='sm'
          variant={offsetMode === OffsetMode.Relative ? 'ontime-filled' : 'ontime-subtle'}
          onClick={() => setOffsetMode(OffsetMode.Relative)}
        >
          Relative
        </Button>
      </ButtonGroup>
      <RundownMenu />
    </div>
  );
}
