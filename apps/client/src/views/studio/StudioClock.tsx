import { FitText } from '../../common/components/fit-text/FitText';
import { cx } from '../../common/utils/styleUtils';

import { getFormattedTime } from './studioclock.utils';

import './StudioClock.scss';

const secondsIndicators = [...Array(60).keys()];

interface StudioClockProps {
  onAir: boolean;
  clock: number;
}

export default function StudioClock(props: StudioClockProps) {
  const { onAir, clock } = props;

  const { formatted, seconds } = getFormattedTime(clock);

  return (
    <div className='studio__clock'>
      <div className='clock-container'>
        {secondsIndicators.map((i) => {
          return (
            <div
              key={i}
              className={cx(['second', i <= seconds && 'second--active'])}
              style={{ transform: `rotate(${180 + i * 6}deg) translateY(var(--half-size))` }}
            />
          );
        })}
        <div>AM</div>
        <FitText mode='single' min={32} max={128} className='clock-container__time'>
          {formatted}
        </FitText>
        <div className={cx(['on-air', onAir && 'on-air--active'])}>ON AIR</div>
      </div>
    </div>
  );
}
