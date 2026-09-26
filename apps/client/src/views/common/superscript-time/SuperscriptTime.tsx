import { CSSProperties, ReactNode } from 'react';

import './SuperscriptTime.scss';

interface SuperscriptTimeProps {
  time: string;
  className?: string;
  style?: CSSProperties;
  /** element rendered after the time, eg: a day shift marker */
  suffix?: ReactNode;
}

/**
 * When the timer includes seconds, we want to split it from the rest
 */
function getTimerParts(time: string) {
  if (time.length !== 8) {
    return [time, ''];
  }

  return [time.slice(0, 5), time.slice(5)];
}

/**
 * Receives a time string and formats it with a subscript or superscript
 * @example 12:00 AM -> AM becomes a superscript
 * @example 12:00:10 -> the seconds become a subscript
 */
export default function SuperscriptTime({ time, className, style, suffix }: SuperscriptTimeProps) {
  // we assume anything after space is a period tag
  const [timeString, period] = time.split(' ');
  const [mainTime, subscript] = getTimerParts(timeString);

  return (
    <div className={className} style={style}>
      {mainTime}
      {subscript && <span className='subscript'>{subscript}</span>}
      {period && <sup className='period'>{period}</sup>}
      {suffix}
    </div>
  );
}
