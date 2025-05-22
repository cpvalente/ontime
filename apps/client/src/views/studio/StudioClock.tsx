import { FitText } from '../../common/components/fit-text/FitText';
import { cx } from '../../common/utils/styleUtils';

import { getClockData } from './studioclock.utils';

import './StudioClock.scss';

const activeIndicators = [...Array(12).keys()];
const secondsIndicators = [...Array(60).keys()];

interface StudioClockProps {
  onAir: boolean;
  clock: number;
}

export default function StudioClock(props: StudioClockProps) {
  const { onAir, clock } = props;

  // TODO: if hide right section, we should always show the clock
  const { seconds, display, thing } = getClockData(clock);

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
        {thing && <div className='ampm'>{thing}</div>}
        <FitText mode='single' min={32} max={128} className='clock-container__time'>
          {display}
        </FitText>
        <div className={cx(['on-air', onAir && 'on-air--active'])}>ON AIR</div>
      </div>
    </div>
  );
}
