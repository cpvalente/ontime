import { MutableRefObject } from 'react';
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
  subscribedAlias: string;
  showSeconds: boolean;
  isPast: boolean;
  selectedRef?: MutableRefObject<HTMLDivElement>;
}

// extract this to contain re-renders
function RollingTime() {
  const timer = useTimer();
  return <>{formatTime(timer.current, { showSeconds: true, format: 'hh:mm:ss' })}</>;
}

export default function OperatorEvent(props: OperatorEventProps) {
  const { data, cue, isSelected, subscribed, subscribedAlias, showSeconds, isPast, selectedRef } = props;

  const start = formatTime(data.timeStart, { showSeconds });
  const end = formatTime(data.timeEnd, { showSeconds });

  const cueColours = data.colour && getAccessibleColour(data.colour);
  const subscribedData = (subscribed ? data?.[subscribed] : undefined) || '';

  const operatorClasses = cx([
    style.event,
    isSelected ? style.running : null,
    subscribedData ? style.subscribed : null,
    isPast ? style.past : null,
  ]);

  return (
    <div className={operatorClasses} ref={selectedRef}>
      <div className={style.binder} style={{ ...cueColours }}>
        <span className={style.cue}>{cue}</span>
      </div>

      <span className={style.mainField}>{data.title}</span>
      <span className={style.schedule}>
        {start} - {end}
      </span>

      <span className={style.secondaryField}>{data.subtitle}</span>
      <span className={style.running}>
        <DelayIndicator delayValue={data.delay} />
        {isSelected ? <RollingTime /> : formatTime(data.duration, { showSeconds: true, format: 'hh:mm:ss' })}
      </span>

      <div className={style.fields}>
        {subscribedData && (
          <>
            <span className={style.field}>{subscribedAlias}</span>
            <span className={style.value}>{subscribedData}</span>
          </>
        )}
      </div>
    </div>
  );
}
