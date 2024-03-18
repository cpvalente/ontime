import { Tooltip } from '@chakra-ui/react';
import { useFullscreen } from '@mantine/hooks';
import { IoContract } from '@react-icons/all-files/io5/IoContract';
import { IoExpand } from '@react-icons/all-files/io5/IoExpand';
import { IoLocate } from '@react-icons/all-files/io5/IoLocate';
import { IoSettingsOutline } from '@react-icons/all-files/io5/IoSettingsOutline';
import { Playback, ProjectData } from 'ontime-types';

import PlaybackIcon from '../../../common/components/playback-icon/PlaybackIcon';
import useProjectData from '../../../common/hooks-query/useProjectData';
import { cx, enDash } from '../../../common/utils/styleUtils';
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
  const { fullscreen, toggle } = useFullscreen();
  const { data: project } = useProjectData();

  const exportProject = () => {
    if (project) {
      handleExport(project);
    }
  };

  const selected = !featureData.numEvents
    ? 'No events'
    : `Event ${featureData.selectedEventIndex != null ? featureData.selectedEventIndex + 1 : enDash}/${
        featureData.numEvents ? featureData.numEvents : enDash
      }`;

  return (
    <div className={style.header}>
      <div className={style.event}>
        <div className={style.title}>{project?.title || enDash}</div>
        <div className={style.eventNow}>{featureData?.titleNow || enDash}</div>
      </div>
      <div className={style.playback}>
        <div className={style.playbackLabel}>{selected}</div>
        <PlaybackIcon state={featureData.playback} />
      </div>
      <CuesheetTableHeaderTimers />
      <div className={style.headerActions}>
        <Tooltip openDelay={tooltipDelayFast} label='Toggle follow'>
          <span
            onClick={() => toggleFollow()}
            className={cx([style.actionIcon, followSelected ? style.enabled : null])}
          >
            <IoLocate />
          </span>
        </Tooltip>
        <Tooltip openDelay={tooltipDelayFast} label='Toggle settings'>
          <span
            onClick={() => toggleSettings()}
            className={cx([style.actionIcon, showSettings ? style.enabled : null])}
          >
            <IoSettingsOutline />
          </span>
        </Tooltip>
        <Tooltip openDelay={tooltipDelayFast} label='Toggle Fullscreen'>
          <span onClick={() => toggle()} className={style.actionIcon}>
            {fullscreen ? <IoContract /> : <IoExpand />}
          </span>
        </Tooltip>
        <Tooltip openDelay={tooltipDelayFast} label='Export rundown'>
          <span className={style.actionText} onClick={exportProject}>
            Export CSV
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
