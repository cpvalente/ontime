import { ButtonGroup } from '@chakra-ui/react';
import { IoOptions } from '@react-icons/all-files/io5/IoOptions';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';

import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
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
      <ButtonGroup isAttached>
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
      <RundownMenu />
    </div>
  );
}
