import { IoChevronUp } from '@react-icons/all-files/io5/IoChevronUp';
import { OntimeEvent } from 'ontime-types';

import { formatTime } from '../../../common/utils/time';

import style from './OpEvent.module.scss';

type OpEventProps = {
  data: OntimeEvent;
  id: number;
};

export default function OpEvent({ data, id }: OpEventProps) {
  const start = formatTime(data.timeStart, { format: 'hh:mm' });
  const end = formatTime(data.timeEnd, { format: 'hh:mm' });
  return (
    <>
      <div className={style.alias}>{data.note}</div>
      <div className={style.block}>
        <div className={style.event}>
          <div className={style.title}>
            {data.title} - {data.subtitle}
          </div>
          <div className={style.time}>
            <div>
              {start} - {end}
            </div>
            <div className={style.indicator}>
              <div className={style.chevron}>
                <IoChevronUp />
              </div>
              --:--:--
            </div>
          </div>
        </div>
        {id % 3 == 0 && <div className={style.fields}>CAM 5 Slow pan to SL</div>}
      </div>
    </>
  );
}
