/**
 * encapsulate logic related to showing a running timer
 */

import { MaybeNumber } from 'ontime-types';
import { removeLeadingZero, removeSeconds } from 'ontime-utils';

import { formatedTime } from '../../../overview/overviewUtils';

interface RunningTimeProps {
  value: MaybeNumber;
  hideSeconds?: boolean;
  hideLeadingZero?: boolean;
  className?: string;
}

export default function RunningTime(props: RunningTimeProps) {
  const { value, hideSeconds, hideLeadingZero, className } = props;
  let formattedTime = formatedTime(value, hideSeconds || hideLeadingZero ? 2 : 3);

  if (hideLeadingZero) {
    formattedTime = removeLeadingZero(formattedTime);
  }

  if (hideSeconds) {
    formattedTime = removeSeconds(formattedTime);
  }

  return <div className={className}>{formattedTime}</div>;
}
