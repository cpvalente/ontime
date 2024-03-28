import { useMemo } from 'react';
import { Button, ButtonGroup, MenuButton } from '@chakra-ui/react';
import { IoAdd } from '@react-icons/all-files/io5/IoAdd';
import { IoOptions } from '@react-icons/all-files/io5/IoOptions';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { IoSnowOutline } from '@react-icons/all-files/io5/IoSnowOutline';
import { isOntimeEvent, RundownCached } from 'ontime-types';

import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
import { AppMode, useAppMode } from '../../../common/stores/appModeStore';
import { useEventCopy } from '../../../common/stores/eventCopySore';

import RundownMenu from './RundownMenu';

import style from './RundownHeader.module.scss';

interface RundownProps {
  data: RundownCached;
}

export default function RundownHeader({ data }: RundownProps) {
  const { rundown } = data;
  const appMode = useAppMode((state) => state.mode);
  const eventCopyId = useEventCopy((state) => state.eventCopyId);
  const setAppMode = useAppMode((state) => state.setMode);
  const setRunMode = () => setAppMode(AppMode.Run);
  const setEditMode = () => setAppMode(AppMode.Edit);
  const setFreezeMode = () => setAppMode(AppMode.Freeze);

  const inClipBoard = useMemo(() => {
    if (!eventCopyId) return '';

    const clipEvent = rundown[eventCopyId];

    if (!isOntimeEvent(clipEvent)) return '';

    const idCueName = `${clipEvent.cue} | ${clipEvent.title}`;
    const compressedName = idCueName.length > 35 ? `${idCueName.slice(0, 35)}...` : idCueName;
    return `COPY: ${compressedName}`;
  }, [eventCopyId, rundown]);

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
      <div style={{ opacity: '30%' }}>{inClipBoard}</div>
      <RundownMenu>
        <MenuButton size='sm' as={Button} rightIcon={<IoAdd />} aria-label='Rundown menu' variant='ontime-outlined'>
          Rundown
        </MenuButton>
      </RundownMenu>
    </div>
  );
}
