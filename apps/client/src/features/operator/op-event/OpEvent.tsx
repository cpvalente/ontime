import { OntimeEvent } from 'ontime-types';

import { formatTime } from '../../../common/utils/time';

import style from './OpEvent.module.scss';

type OpEventProps = {
  data: OntimeEvent;
};

export default function OpEvent({ data }: OpEventProps) {
  const start = formatTime(data.timeStart, { format: 'hh:mm' });
  const end = formatTime(data.timeEnd, { format: 'hh:mm' });
  return (
    <>
      <div className={style.alias}>{data.note}</div>
      <div className={style.title}>
        {data.title} - {data.subtitle}
      </div>
      <div className={style.time}>
        <div>
          {start} - {end}
        </div>
        --:--:--
      </div>
    </>
  );
}
