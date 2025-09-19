import { OntimeEvent } from 'ontime-types';
import { useRuntimeOffset } from '../../../common/hooks/useSocket';
import { useExpectedTime } from '../../../common/utils/expected';
import { getOffsetState } from '../../../common/utils/offset';
import { ExtendedEntry } from '../../../common/utils/rundownMetadata';
import { cx } from '../../../common/utils/styleUtils';
import { formatTime } from '../../../common/utils/time';
import SuperscriptTime from '../../../features/viewers/common/superscript-time/SuperscriptTime';

import { useScheduleOptions } from './schedule.options';

import './Schedule.scss';

const formatOptions = {
  format12: 'hh:mm a',
  format24: 'HH:mm',
};

interface ScheduleItemProps {
  event: ExtendedEntry<OntimeEvent>;
}

export default function ScheduleItem({ event }: ScheduleItemProps) {
  const { showExpected } = useScheduleOptions();

  if (showExpected) {
    return <ExpectedScheduleItem event={event} />;
  }

  // TODO:
  // if (delay > 0) {
  //   return (
  //     <DelayedScheduleItem
  //       timeStart={timeStart}
  //       timeEnd={timeEnd}
  //       title={title}
  //       colour={colour}
  //       skip={skip}
  //       delay={delay}
  //     />
  //   );
  // }

  const start = formatTime(event.timeStart, formatOptions);
  const end = formatTime(event.timeEnd, formatOptions);
  return (
    <li className={cx(['entry', event.skip && 'entry--skip'])}>
      <div className='entry-times'>
        <span className='entry-colour' style={{ backgroundColor: event.colour }} />
        <SuperscriptTime time={start} />
        →
        <SuperscriptTime time={end} />
      </div>
      <div className='entry-title'>{event.title}</div>
    </li>
  );
}

// function DelayedScheduleItem({ timeStart, timeEnd, title, colour, skip, delay }: ScheduleItemProps) {
//   const start = formatTime(timeStart, formatOptions);
//   const end = formatTime(timeEnd, formatOptions);
//   const delayedStart = formatTime(timeStart + delay, formatOptions);
//   const delayedEnd = formatTime(timeEnd + delay, formatOptions);

//   return (
//     <li className={cx(['entry', skip && 'entry--skip'])}>
//       <div className='entry-times'>
//         <span className='entry-times--delayed'>
//           <span className='entry-colour' style={{ backgroundColor: colour }} />
//           <SuperscriptTime time={start} />
//           →
//           <SuperscriptTime time={end} />
//         </span>
//         <span className='entry-times--delay'>
//           <SuperscriptTime time={delayedStart} />
//           →
//           <SuperscriptTime time={delayedEnd} />
//         </span>
//       </div>
//       <div className='entry-title'>{title}</div>
//     </li>
//   );
// }

function ExpectedScheduleItem({ event }: ScheduleItemProps) {
  const { timeStart, timeEnd } = useExpectedTime(event);

  return (
    <li className={cx(['entry', event.skip && 'entry--skip'])}>
      <div className='entry-times'>
        <span className='entry-colour' style={{ backgroundColor: event.colour }} />
        <ExpectedTime time={timeStart} delay={timeStart - event.timeStart} />
        →
        <ExpectedTime time={timeEnd} delay={timeEnd - event.timeEnd} />
      </div>
      <div className='entry-title'>{event.title}</div>
    </li>
  );
}

interface ExpectedTimeProps {
  time: number;
  delay: number;
}

function ExpectedTime({ time, delay }: ExpectedTimeProps) {
  const expectedTime = formatTime(time, formatOptions);
  const expectedState = getOffsetState(delay);

  return <SuperscriptTime className={`entry-times--${expectedState}`} time={expectedTime} />;
}
