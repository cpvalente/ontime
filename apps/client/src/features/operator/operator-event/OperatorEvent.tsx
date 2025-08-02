import { memo, RefObject, SyntheticEvent } from 'react';
import { useLongPress } from '@mantine/hooks';
import { MILLIS_PER_MINUTE, MILLIS_PER_SECOND, millisToString } from 'ontime-utils';

import DelayIndicator from '../../../common/components/delay-indicator/DelayIndicator';
import { cx, getAccessibleColour } from '../../../common/utils/styleUtils';
import { formatDuration, useExpectedStart } from '../../../common/utils/time';
import RunningTime from '../../viewers/common/running-time/RunningTime';
import type { EditEvent, Subscribed } from '../operator.types';

import style from './OperatorEvent.module.scss';

interface OperatorEventProps {
  id: string;
  colour: string;
  cue: string;
  main: string;
  secondary: string;
  timeStart: number;
  duration: number;
  delay: number;
  dayOffset: number;
  isLinkedToLoaded: boolean;
  isSelected: boolean;
  isPast: boolean;
  selectedRef?: RefObject<HTMLDivElement | null>;
  showStart: boolean;
  subscribed: Subscribed;
  totalGap: number;
  onLongPress: (event: EditEvent) => void;
}

export default memo(OperatorEvent);
function OperatorEvent({
  id,
  colour,
  cue,
  main,
  secondary,
  timeStart,
  duration,
  delay,
  dayOffset,
  isLinkedToLoaded,
  isSelected,
  isPast,
  selectedRef,
  showStart,
  subscribed,
  totalGap,
  onLongPress,
}: OperatorEventProps) {
  /**
   * gather behaviour for long press and context menu
   */
  const handleLongPress = (event?: SyntheticEvent) => {
    // we dont have an event out of useLongPress
    event?.preventDefault();
    if (subscribed) {
      onLongPress({ id, cue, subscriptions: subscribed });
    }
  };

  const mouseHandlers = useLongPress(handleLongPress);
  const cueColours = colour && getAccessibleColour(colour);

  const operatorClasses = cx([
    style.event,
    isSelected && style.running,
    isPast && style.past,
  ]);

  return (
    <div className={operatorClasses} ref={selectedRef} onContextMenu={handleLongPress} {...mouseHandlers}>
      <div className={style.binder} style={{ ...cueColours }}>
        <span className={style.cue}>{cue}</span>
      </div>

      <span className={style.mainField}>
        {showStart && <span className={style.plannedStart}>{millisToString(timeStart)}</span>}
        {main}
        </span>
      <span className={style.secondaryField}>{secondary}</span>
      <OperatorEventSchedule
        timeStart={timeStart}
        isPast={isPast}
        isSelected={isSelected}
        delay={delay}
        dayOffset={dayOffset}
        totalGap={totalGap}
        isLinkedToLoaded={isLinkedToLoaded}
      />
      <span className={style.runningTime}>
        <DelayIndicator delayValue={delay} />
        <RunningTime className={cx([isSelected && style.muted])} value={duration} hideLeadingZero />
      </span>

      <div className={style.fields}>
        {subscribed
          .filter((field) => field.value)
          .map((field) => {
            const fieldClasses = cx([style.field, !field.colour ? style.noColour : null]);
            return (
              <div key={field.id}>
                <span className={fieldClasses} style={{ backgroundColor: field.colour }}>
                  {field.label}
                </span>
                <span className={style.value} style={{ color: field.colour }}>
                  {field.value}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

interface OperatorEventScheduleProps {
  timeStart: number;
  isPast: boolean;
  isSelected: boolean;
  delay: number;
  dayOffset: number;
  totalGap: number;
  isLinkedToLoaded: boolean;
}
function OperatorEventSchedule({
  timeStart,
  isPast,
  isSelected,
  delay,
  dayOffset,
  totalGap,
  isLinkedToLoaded,
}: OperatorEventScheduleProps) {
  if (isPast) {
    return <span className={style.timeUntil}>DONE</span>;
  }

  if (isSelected) {
    return <span className={style.timeUntil}>LIVE</span>;
  }

  return (
    <TimeUntil
      timeStart={timeStart}
      delay={delay}
      dayOffset={dayOffset}
      totalGap={totalGap}
      isLinkedToLoaded={isLinkedToLoaded}
    />
  );
}

interface TimeUntilProps {
  timeStart: number;
  delay: number;
  dayOffset: number;
  totalGap: number;
  isLinkedToLoaded: boolean;
}
function TimeUntil({ timeStart, delay, dayOffset, totalGap, isLinkedToLoaded }: TimeUntilProps) {
  // we isolate this to avoid unnecessary re-renders
  const timeUntil = useExpectedStart({ timeStart, delay, dayOffset }, { totalGap, isLinkedToLoaded });

  const isDue = timeUntil < MILLIS_PER_SECOND;
  const timeUntilString = isDue ? 'DUE' : `${formatDuration(Math.abs(timeUntil), timeUntil > 2 * MILLIS_PER_MINUTE)}`;

  return <span className={style.timeUntil}>{timeUntilString}</span>;
}
