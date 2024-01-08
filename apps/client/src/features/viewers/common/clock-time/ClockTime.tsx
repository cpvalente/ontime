/**
 * encapsulate logic related to showing a clock timer (hide seconds and whatnot)
 */

import { MaybeNumber } from 'ontime-types';

import { formatTime } from '../../../../common/utils/time';
import { FORMAT_12, FORMAT_24 } from '../../../../viewerConfig';
import SuperscriptTime from '../superscript-time/SuperscriptTime';

interface ClockTimeProps {
  value: MaybeNumber;
  preferredFormat12?: string;
  preferredFormat24?: string;
  className?: string;
}

export default function ClockTime(props: ClockTimeProps) {
  const { value, preferredFormat12 = FORMAT_12, preferredFormat24 = FORMAT_24, className } = props;

  // TODO: get params
  const formattedTime = formatTime(value, { format12: preferredFormat12, format24: preferredFormat24 });

  return <SuperscriptTime className={className} time={formattedTime} />;
}
