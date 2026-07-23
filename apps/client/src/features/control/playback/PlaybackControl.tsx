import { IoSettingsOutline } from 'react-icons/io5';

import IconButton from '../../../common/components/buttons/IconButton';
import Tooltip from '../../../common/components/tooltip/Tooltip';
import { usePlaybackControl } from '../../../common/hooks/useSocket';
import useAppSettingsNavigation from '../../app-settings/useAppSettingsNavigation';
import AddTime from './add-time/AddTime';
import { AuxTimer } from './aux-timer/AuxTimer';
import PlaybackButtons from './playback-buttons/PlaybackButtons';
import PlaybackTimer from './playback-timer/PlaybackTimer';

import style from './PlaybackControl.module.scss';

export default function PlaybackControl() {
  const data = usePlaybackControl();
  const { setLocation } = useAppSettingsNavigation();

  return (
    <div className={style.mainContainer}>
      <PlaybackTimer>
        <AddTime playback={data.playback} />
      </PlaybackTimer>
      <PlaybackButtons
        playback={data.playback}
        numEvents={data.numEvents}
        selectedEventIndex={data.selectedEventIndex}
        timerPhase={data.timerPhase}
      />
      <div className={style.auxHeader}>
        <span>Aux timers</span>
        <Tooltip
          text='Name aux timers'
          render={
            <IconButton
              size='small'
              variant='subtle'
              aria-label='Name aux timers'
              onClick={() => setLocation('settings__aux-timers')}
            />
          }
        >
          <IoSettingsOutline />
        </Tooltip>
      </div>
      <div className={style.auxTimers}>
        <AuxTimer index={1} />
        <AuxTimer index={2} />
        <AuxTimer index={3} />
      </div>
    </div>
  );
}
