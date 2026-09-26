/**
 * encapsulate logic related to showing a clock timer
 */

import { MaybeNumber } from 'ontime-types';

import { formatTime } from '../../../common/utils/time';
import { FORMAT_12, FORMAT_24 } from '../../../viewerConfig';
import SuperscriptTime from '../superscript-time/SuperscriptTime';
import DayShift from '../timezone/DayShift';

interface ClockTimeProps {
  value: MaybeNumber;
  preferredFormat12?: string;
  preferredFormat24?: string;
  className?: string;
  /** shift to a display timezone, see useDisplayTimezone */
  timezoneDelta?: number;
}

export default function ClockTime(props: ClockTimeProps) {
  const { value, preferredFormat12 = FORMAT_12, preferredFormat24 = FORMAT_24, className, timezoneDelta = 0 } = props;

  // TODO: should we get the params from URL here to see if the user is overriding the default?
  const formattedTime = formatTime(value, { format12: preferredFormat12, format24: preferredFormat24, timezoneDelta });

  return (
    <SuperscriptTime
      className={className}
      time={formattedTime}
      suffix={<DayShift time={value} timezoneDelta={timezoneDelta} />}
    />
  );
}
