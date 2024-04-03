import { useMemo } from 'react';
import { ButtonGroup } from '@chakra-ui/react';
import { IoOptions } from '@react-icons/all-files/io5/IoOptions';
import { IoPlay } from '@react-icons/all-files/io5/IoPlay';
import { isOntimeBlock, isOntimeDelay, isOntimeEvent, RundownCached } from 'ontime-types';

import TooltipActionBtn from '../../../common/components/buttons/TooltipActionBtn';
import { AppMode, useAppMode } from '../../../common/stores/appModeStore';
import { useEventCopy } from '../../../common/stores/eventCopySore';
import { millisToDelayString } from '../../../common/utils/dateConfig';

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

  const inClipBoard = useMemo(() => {
    if (!eventCopyId) return '';

    const clipEvent = rundown[eventCopyId];

    if (isOntimeEvent(clipEvent)) {
      const idCueName = `${clipEvent.cue} | ${clipEvent.title}`;
      const compressedName = idCueName.length > 35 ? `${idCueName.slice(0, 35)}...` : idCueName;
      return `COPY: ${compressedName}`;
    } else if (isOntimeBlock(clipEvent)) {
      const blockName = `BLOCK | ${clipEvent.title}`;
      const compressedName = blockName.length > 35 ? `${blockName.slice(0, 35)}...` : blockName;
      return `COPY: ${compressedName}`;
    } else if (isOntimeDelay(clipEvent)) {
      const delayName = `DELAY | ${millisToDelayString(clipEvent.duration)}`;
      return `COPY: ${delayName}`;
    } else {
      return '';
    }
  }, [eventCopyId, rundown]);

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
      <span style={{ opacity: '30%' }}>{inClipBoard}</span>
      <RundownMenu />
    </div>
  );
}
