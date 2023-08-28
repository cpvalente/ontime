import { OntimeEvent, UserFields } from 'ontime-types';

import DelayIndicator from '../../../common/components/delay-indicator/DelayIndicator';
import { useTimer } from '../../../common/hooks/useSocket';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';

import style from './OperatorEvent.module.scss';

interface OperatorEventProps {
  data: OntimeEvent;
  cue: string;
  isSelected: boolean;
  subscribed: keyof UserFields | null;
  showSeconds: boolean;
}

// extract this to contain re-renders
function RollingTime() {
  const timer = useTimer();
  return <>{formatTime(timer.current, { showSeconds: true, format: 'hh:mm:ss' })}</>;
}

export default function OperatorEvent(props: OperatorEventProps) {
  const { data, cue, isSelected, subscribed, showSeconds } = props;

  const start = formatTime(data.timeStart, { showSeconds });
  const end = formatTime(data.timeEnd, { showSeconds });

  const cueColours = data.colour && getAccessibleColour(data.colour);
  const subscribedData = (subscribed ? data?.[subscribed] : undefined) || '';

  const operatorClasses = cx([
    style.event,
    isSelected ? style.running : null,
    subscribedData ? style.subscribed : null,
  ]);

  return (
    <div className={operatorClasses}>
      <div className={style.titles}>
        <span className={style.title}>
          {data.title} - {data.subtitle}
        </span>
        <span className={style.cue} style={{ ...cueColours }}>
          {cue}
        </span>
      </div>

      <div className={style.times}>
        <span className={style.schedule}>
          {start} - {end}
        </span>
        <span className={style.runtime}>
          <DelayIndicator delayValue={data.delay} />
          {isSelected ? <RollingTime /> : formatTime(data.duration, { showSeconds: true, format: 'hh:mm:ss' })}
        </span>
      </div>

      <div className={style.fields}>{subscribedData}</div>
    </div>
  );
}
