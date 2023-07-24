import { OntimeEvent, UserFields } from 'ontime-types';

import DelayIndicator from '../../../common/components/delay-indicator/DelayIndicator';
import { useTimer } from '../../../common/hooks/useSocket';
import { getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';

import style from './OpEvent.module.scss';

type OpEventProps = {
  data: OntimeEvent;
  index: number;
  isSelected: boolean;
  subscribed?: keyof UserFields;
};

function RollingTime() {
  const timer = useTimer();
  return <>{formatTime(timer.current, { showSeconds: true, format: 'hh:mm:ss' })}</>;
}

export default function OpEvent({ data, index, isSelected, subscribed }: OpEventProps) {
  const start = formatTime(data.timeStart, { format: 'hh:mm' });
  const end = formatTime(data.timeEnd, { format: 'hh:mm' });

  const cueColours = data.colour && getAccessibleColour(data.colour);
  const subscribedData = (subscribed ? data?.[subscribed] : undefined) || '';

  // @arihanv when selected, the whole row should become green
  return (
    <div className={`${isSelected ? style.runningTimer : undefined}`}>
      <div className={style.scheduledEvent}>
        <div className={style.cue} style={{ ...cueColours }}>
          {index}
        </div>
        <div className={style.event}>
          <div className={style.title}>
            {data.title} - {data.subtitle}
          </div>
          <div className={style.time}>
            <div>
              {start} - {end}
            </div>
            <div className={style.indicator}>
              <DelayIndicator delayValue={data.delay} />
              {isSelected ? <RollingTime /> : formatTime(data.duration, { showSeconds: true, format: 'hh:mm:ss' })}
            </div>
          </div>
        </div>
      </div>
      {/** @arihanv we likely want to animate the height of the fields div  */}
      <div className={style.fields}>{subscribedData}</div>
    </div>
  );
}
