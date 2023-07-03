import { EventData } from 'ontime-types';
import style from './OpEvent.module.scss';
import { formatTime } from '../../../common/utils/time';

type Props = {
  data: any;
};

export default function OpEvent({ data }: Props) {
  const start = formatTime(data.timeStart, { format: 'hh:mm' });
  const end = formatTime(data.timeEnd, { format: 'hh:mm' });
  return (
    <>
      <div className={style.alias}>{data.note}</div>
      <div  className={style.title}>
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
