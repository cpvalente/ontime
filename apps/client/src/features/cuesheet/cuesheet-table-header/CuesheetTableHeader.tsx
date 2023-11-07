import { Tooltip } from '@chakra-ui/react';
import { IoContract } from '@react-icons/all-files/io5/IoContract';
import { IoExpand } from '@react-icons/all-files/io5/IoExpand';
import { IoLocate } from '@react-icons/all-files/io5/IoLocate';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';
import { Playback, ProjectData } from 'ontime-types';

import PlaybackIcon from '../../../common/components/playback-icon/PlaybackIcon';
import useFullscreen from '../../../common/hooks/useFullscreen';
import useProjectData from '../../../common/hooks-query/useProjectData';
import { tooltipDelayFast } from '../../../ontimeConfig';
import { useCuesheetSettings } from '../store/CuesheetSettings';

import CuesheetTableHeaderTimers from './CuesheetTableHeaderTimers';

import style from './CuesheetTableHeader.module.scss';

interface CuesheetTableHeaderProps {
  handleExport: (headerData: ProjectData) => void;
  featureData: {
    playback: Playback;
    selectedEventIndex: number | null;
    numEvents: number;
    titleNow: string | null;
  };
}

export default function CuesheetTableHeader({ handleExport, featureData }: CuesheetTableHeaderProps) {
  const followSelected = useCuesheetSettings((state) => state.followSelected);
  const showSettings = useCuesheetSettings((state) => state.showSettings);
  const toggleSettings = useCuesheetSettings((state) => state.toggleSettings);
  const toggleFollow = useCuesheetSettings((state) => state.toggleFollow);
  const { isFullScreen, toggleFullScreen } = useFullscreen();
  const { data: project } = useProjectData();

  const exportProject = () => {
    if (project) {
      handleExport(project);
    }
  };

  const selected = !featureData.numEvents
    ? 'No events'
    : `Event ${featureData.selectedEventIndex != null ? featureData.selectedEventIndex + 1 : '-'}/${
        featureData.numEvents ? featureData.numEvents : '-'
      }`;

  return (
    <div className={style.header}>
      <div className={style.event}>
        <div className={style.title}>{project?.title || '-'}</div>
        <div className={style.eventNow}>{featureData?.titleNow || '-'}</div>
      </div>
      <div className={style.playback}>
        <div className={style.playbackLabel}>{selected}</div>
        <PlaybackIcon state={featureData.playback} />
      </div>
      <CuesheetTableHeaderTimers />
      <div className={style.headerActions}>
        <Tooltip openDelay={tooltipDelayFast} label='Toggle follow'>
          <span onClick={() => toggleFollow()} className={`${style.actionIcon} ${followSelected ? style.enabled : ''}`}>
            <IoLocate />
          </span>
        </Tooltip>
        <Tooltip openDelay={tooltipDelayFast} label='Toggle settings'>
          <span onClick={() => toggleSettings()} className={`${style.actionIcon} ${showSettings ? style.enabled : ''}`}>
            <IoSettingsOutline />
          </span>
        </Tooltip>
        <Tooltip openDelay={tooltipDelayFast} label='Toggle Fullscreen'>
          <span onClick={() => toggleFullScreen()} className={style.actionIcon}>
            {isFullScreen ? <IoContract /> : <IoExpand />}
          </span>
        </Tooltip>
        <Tooltip openDelay={tooltipDelayFast} label='Export rundown'>
          <span className={style.actionIcon} onClick={exportProject}>
            Export
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
