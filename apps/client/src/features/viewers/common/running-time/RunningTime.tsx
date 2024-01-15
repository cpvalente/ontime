/**
 * encapsulate logic related to showing a running timer
 */

import { MaybeNumber } from 'ontime-types';
import { millisToString, removeLeadingZero, removeSeconds } from 'ontime-utils';

interface RunningTimeProps {
  value: MaybeNumber;
  hideSeconds?: boolean;
  hideLeadingZero?: boolean;
  className?: string;
}

export default function RunningTime(props: RunningTimeProps) {
  const { value, hideSeconds, hideLeadingZero, className } = props;
  let formattedTime = millisToString(value);

  if (hideLeadingZero) {
    formattedTime = removeLeadingZero(formattedTime);
  }

  if (hideSeconds) {
    formattedTime = removeSeconds(formattedTime);
  }

  return <div className={className}>{formattedTime}</div>;
}
