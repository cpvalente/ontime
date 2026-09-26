import { Playback } from 'ontime-types';

import { useAutoTickingClock } from '../../common/hooks/useAutoTickingClock';
import { useDisplayTimezone } from '../../common/hooks/useDisplayTimezone';
import { useIsSmallScreen } from '../../common/hooks/useIsSmallScreen';
import { useStudioClockSocket } from '../../common/hooks/useSocket';
import { cx } from '../../common/utils/styleUtils';
import { formatTime } from '../../common/utils/time';
import SuperscriptTime from '../common/superscript-time/SuperscriptTime';
import ShowTimeAnchor from '../common/timezone/ShowTimeAnchor';
import { useStudioOptions } from './studio.options';
import { getLargeClockData } from './studioClock.utils';

import './StudioClock.scss';

const activeIndicators = [...Array(12).keys()];
const secondsIndicators = [...Array(60).keys()];

interface StudioClockProps {
  hideCards: boolean;
}

export default function StudioClock({ hideCards }: StudioClockProps) {
  const { timeformat } = useStudioOptions();
  const isSmallScreen = useIsSmallScreen();
  const clock = useAutoTickingClock();
  const { playback } = useStudioClockSocket();
  const { timezoneDelta } = useDisplayTimezone();
  const onAir = playback !== Playback.Stop;

  // if we are on mobile and have to show the cards
  if (isSmallScreen && !hideCards) {
    return <StudioClockMobile clock={clock} onAir={onAir} timeformat={timeformat} timezoneDelta={timezoneDelta} />;
  }

  const { seconds, display, meridian } = getLargeClockData(clock, timeformat, timezoneDelta);

  return (
    <div className='studio__clock'>
      <div className='clock-container'>
        {secondsIndicators.map((i) => {
          return (
            <div
              key={i}
              className={cx(['tick', i <= seconds && 'tick--active'])}
              style={{ transform: `rotate(${180 + i * 6}deg) translateY(var(--half-size))` }}
            />
          );
        })}
        {activeIndicators.map((i) => (
          <div
            key={i}
            className='tick tick--active'
            style={{
              transform: `rotate(${180 + i * 30}deg) translateX(var(--smaller-half-size))`,
            }}
          />
        ))}
        <div className={cx(['ampm', Boolean(meridian) && 'ampm--active'])}>{meridian}</div>
        <div className='time time--large'>
          {display}
          <ShowTimeAnchor className='show-time' clock={clock} timezoneDelta={timezoneDelta} timeformat={timeformat} />
        </div>
        <div className={cx(['on-air', onAir && 'on-air--active'])}>ON AIR</div>
      </div>
    </div>
  );
}

interface StudioClockMobileProps {
  clock: number;
  onAir: boolean;
  timeformat: string | null;
  timezoneDelta: number;
}

function StudioClockMobile({ clock, onAir, timeformat, timezoneDelta }: StudioClockMobileProps) {
  const displayClock = formatTime(clock, { override: timeformat, timezoneDelta });

  return (
    <div className='studio__clock studio__clock--small'>
      <SuperscriptTime className='time time--small' time={displayClock} />
      <ShowTimeAnchor className='show-time' clock={clock} timezoneDelta={timezoneDelta} timeformat={timeformat} />
      <div className={cx(['on-air', onAir && 'on-air--active'])}>ON AIR</div>
    </div>
  );
}
