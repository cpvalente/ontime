import { Button } from '@mantine/core';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoOptions } from '@react-icons/all-files/io5/IoOptions';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoSnowOutline } from '@react-icons/all-files/io5/IoSnowOutline';

import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
import { AppMode, useAppMode } from '../../../common/stores/appModeStore';

import RundownMenu from './RundownMenu';

import style from './RundownHeader.module.scss';

export default function RundownHeader() {
  const appMode = useAppMode((state) => state.mode);
  const setAppMode = useAppMode((state) => state.setMode);
  const setRunMode = () => setAppMode(AppMode.Run);
  const setEditMode = () => setAppMode(AppMode.Edit);
  const setFreezeMode = () => setAppMode(AppMode.Freeze);

  return (
    <div className={style.header}>
      <Button.Group>
        <TooltipActionBtn
          variant={appMode === AppMode.Freeze ? 'filled' : 'outlined'}
          size='sm'
          icon={<IoSnowOutline />}
          clickHandler={setFreezeMode}
          tooltip='Freeze rundown'
          aria-label='Freeze rundown'
          disabled
        />
        <TooltipActionBtn
          variant={appMode === AppMode.Run ? 'filled' : 'outlined'}
          size='sm'
          icon={<IoPlay />}
          clickHandler={setRunMode}
          tooltip='Run mode'
          aria-label='Run mode'
        />
        <TooltipActionBtn
          variant={appMode === AppMode.Edit ? 'filled' : 'outlined'}
          size='sm'
          icon={<IoOptions />}
          clickHandler={setEditMode}
          tooltip='Edit mode'
          aria-label='Edit mode'
        />
      </Button.Group>
      <RundownMenu>
        <Button size='sm' rightSection={<IoAdd />} variant='outline'>
          Rundown
        </Button>
      </RundownMenu>
    </div>
  );
}
