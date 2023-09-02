import { RefObject } from 'react';

import DelayIndicator from '../../../common/components/delay-indicator/DelayIndicator';
import { useTimer } from '../../../common/hooks/useSocket';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';

import style from './OperatorEvent.module.scss';

interface OperatorEventProps {
  colour: string;
  cue: string;
  main: string;
  secondary: string;
  timeStart: number;
  timeEnd: number;
  duration: number;
  delay?: number;
  isSelected: boolean;
  subscribed?: string;
  subscribedAlias: string;
  showSeconds: boolean;
  isPast: boolean;
  selectedRef?: RefObject<HTMLDivElement>;
}

// extract this to contain re-renders
function RollingTime() {
  const timer = useTimer();
  return <>{formatTime(timer.current, { showSeconds: true, format: 'hh:mm:ss' })}</>;
}

export default function OperatorEvent(props: OperatorEventProps) {
  const {
    colour,
    cue,
    main,
    secondary,
    timeStart,
    timeEnd,
    duration,
    delay,
    isSelected,
    subscribed,
    subscribedAlias,
    showSeconds,
    isPast,
    selectedRef,
  } = props;

  const start = formatTime(timeStart, { showSeconds });
  const end = formatTime(timeEnd, { showSeconds });

  const cueColours = colour && getAccessibleColour(colour);

  const operatorClasses = cx([
    style.event,
    isSelected ? style.running : null,
    subscribed ? style.subscribed : null,
    isPast ? style.past : null,
  ]);

  return (
    <div className={operatorClasses} ref={selectedRef}>
      <div className={style.binder} style={{ ...cueColours }}>
        <span className={style.cue}>{cue}</span>
      </div>

      <span className={style.mainField}>{main}</span>
      <span className={style.schedule}>
        {start} - {end}
      </span>

      <span className={style.secondaryField}>{secondary}</span>
      <span className={style.running}>
        <DelayIndicator delayValue={delay} />
        {isSelected ? <RollingTime /> : formatTime(duration, { showSeconds: true, format: 'hh:mm:ss' })}
      </span>

      <div className={style.fields}>
        {subscribed && (
          <>
            <span className={style.field}>{subscribedAlias}</span>
            <span className={style.value}>{subscribed}</span>
          </>
        )}
      </div>
    </div>
  );
}
