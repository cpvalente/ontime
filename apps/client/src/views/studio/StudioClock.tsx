import { Playback } from 'ontime-types';

import { useIsSmallScreen } from '../../common/hooks/useIsSmallScreen';
import { useStudioClockSocket } from '../../common/hooks/useSocket';
import { cx } from '../../common/utils/styleUtils';
import { formatTime } from '../../common/utils/time';
import SuperscriptTime from '../../features/viewers/common/superscript-time/SuperscriptTime';

import { getLargeClockData } from './studioClock.utils';

import './StudioClock.scss';

const activeIndicators = [...Array(12).keys()];
const secondsIndicators = [...Array(60).keys()];

interface StudioClockProps {
  hideCards: boolean;
}

export default function StudioClock({ hideCards }: StudioClockProps) {
  const isSmallScreen = useIsSmallScreen();
  const { clock, playback } = useStudioClockSocket();
  const onAir = playback !== Playback.Stop;

  // if we are on mobile and have to show the cards
  if (isSmallScreen && !hideCards) {
    return <StudioClockMobile clock={clock} onAir={onAir} />;
  }

  const { seconds, display, meridian } = getLargeClockData(clock);

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
        <div className='time time--large'>{display}</div>
        <div className={cx(['on-air', onAir && 'on-air--active'])}>ON AIR</div>
      </div>
    </div>
  );
}

interface StudioClockMobileProps {
  clock: number;
  onAir: boolean;
}

function StudioClockMobile({ clock, onAir }: StudioClockMobileProps) {
  const displayClock = formatTime(clock);

  return (
    <div className='studio__clock studio__clock--small'>
      <SuperscriptTime className='time time--small' time={displayClock} />
      <div className={cx(['on-air', onAir && 'on-air--active'])}>ON AIR</div>
    </div>
  );
}
