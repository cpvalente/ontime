import { CSSProperties } from 'react';

import './SuperscriptTime.scss';

interface SuperscriptTimeProps {
  time: string;
  className?: string;
  style?: CSSProperties;
}

export default function SuperscriptTime(props: SuperscriptTimeProps) {
  const { time, className, style } = props;

  // we assume anything after space is a period tag
  const [timeString, period] = time.split(' ');

  return (
    <div className={className} style={style}>
      {timeString}
      {period && <sup className='period'>{period}</sup>}
    </div>
  );
}
