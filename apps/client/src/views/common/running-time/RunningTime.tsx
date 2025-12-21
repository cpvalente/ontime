/**
 * encapsulate logic related to showing a running timer
 */

import { MaybeNumber } from 'ontime-types';
import { removeLeadingZero, removeSeconds } from 'ontime-utils';

import { formattedTime } from '../../../features/overview/overview.utils';

interface RunningTimeProps {
  value: MaybeNumber;
  hideSeconds?: boolean;
  hideLeadingZero?: boolean;
  className?: string;
}

export default function RunningTime(props: RunningTimeProps) {
  const { value, hideSeconds, hideLeadingZero, className } = props;
  let display = formattedTime(value, hideSeconds || hideLeadingZero ? 2 : 3);

  if (hideLeadingZero) {
    display = removeLeadingZero(display);
  }

  if (hideSeconds) {
    display = removeSeconds(display);
  }

  return <div className={className}>{display}</div>;
}
