import { Button, MenuButton } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoOptions } from '@react-icons/all-files/io5/IoOptions';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoSnowOutline } from '@react-icons/all-files/io5/IoSnowOutline';

import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
import { AppMode, useAppMode } from '../../../common/stores/appModeStore';

import RundownMenu from './RundownMenu';

import style from './RundownHeader.module.scss';

export default function RundownHeader() {
  const setAppMode = useAppMode((state) => state.setMode);
  const setRunMode = () => setAppMode(AppMode.Run);
  const setEditMode = () => setAppMode(AppMode.Edit);

  return (
    <div className={style.header}>
      <TooltipActionBtn
        variant='ontime-ghosted'
        size='sm'
        icon={<IoSnowOutline />}
        clickHandler={setRunMode}
        tooltip='Freeze rundown'
        aria-label='Freeze rundown'
      />
      <TooltipActionBtn
        variant='ontime-ghosted'
        size='sm'
        icon={<IoPlay />}
        clickHandler={setRunMode}
        tooltip='Run mode'
        aria-label='Run mode'
      />
      <TooltipActionBtn
        variant='ontime-ghosted'
        size='sm'
        icon={<IoOptions />}
        clickHandler={setEditMode}
        tooltip='Edit mode'
        aria-label='Edit mode'
      />
      <div>
        <RundownMenu>
          <MenuButton size='sm' as={Button} rightIcon={<IoAdd />} aria-label='Rundown menu' variant='ontime-ghosted'>
            Rundown
          </MenuButton>
        </RundownMenu>
      </div>
    </div>
  );
}
