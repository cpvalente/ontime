import './SuperscriptTime.scss';

interface SuperscriptPeriodProps {
  time: string;
  className?: string;
}

/**
 * Receives a time string and formats periods (am/pm) as superscript
 * @example 12:00 AM -> AM becomes a superscript
 * @example 12:00:10 -> no formatting changes applied
 */
export default function SuperscriptPeriod({ time, className }: SuperscriptPeriodProps) {
  // we assume anything after space is a period tag
  const [timeString, period] = time.split(' ');

  return (
    <div className={className}>
      {timeString}
      {period && <sup className='period'>{period}</sup>}
    </div>
  );
}
