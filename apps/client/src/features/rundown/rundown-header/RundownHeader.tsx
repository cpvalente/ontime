import { Button, ButtonGroup, MenuButton } from '@chakra-ui/react';
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
      <ButtonGroup isAttached>
        <TooltipActionBtn
          variant={appMode === AppMode.Freeze ? 'ontime-filled' : 'ontime-outlined'}
          size='sm'
          icon={<IoSnowOutline />}
          clickHandler={setFreezeMode}
          tooltip='Freeze rundown'
          aria-label='Freeze rundown'
          isDisabled
        />
        <TooltipActionBtn
          variant={appMode === AppMode.Run ? 'ontime-filled' : 'ontime-outlined'}
          size='sm'
          icon={<IoPlay />}
          clickHandler={setRunMode}
          tooltip='Run mode'
          aria-label='Run mode'
        />
        <TooltipActionBtn
          variant={appMode === AppMode.Edit ? 'ontime-filled' : 'ontime-outlined'}
          size='sm'
          icon={<IoOptions />}
          clickHandler={setEditMode}
          tooltip='Edit mode'
          aria-label='Edit mode'
        />
      </ButtonGroup>
      <RundownMenu>
        <MenuButton size='sm' as={Button} rightIcon={<IoAdd />} aria-label='Rundown menu' variant='ontime-outlined'>
          Rundown
        </MenuButton>
      </RundownMenu>
    </div>
  );
}
