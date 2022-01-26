import style from './Table.module.scss';
import { FiCheck } from '@react-icons/all-files/fi/FiCheck';
import { stringFromMillis } from 'ontime-utils/time';
import PublicIconBtn from '../../common/components/buttons/PublicIconBtn';

export default function OnTimeTable({ columns, data }) {
  console.log(data);
  return (
    <div className={style.tableContainer}>
      <div className={style.rowHeader}>
        <div style={{ width: '1%' }} className={style.indexColumn}>
          #
        </div>
        {columns.map((c) => (
          <div style={{ width: `${99 / 14}%` }} key={c.accessor} className={style.headerCell}>
            {c.header}
            <FiCheck />
          </div>
        ))}
      </div>
      {data.map((d, index) => (
        <div className={style.row} key={d.id}>
          <div className={style.indexColumn} style={{ width: '1%' }}>
            {index + 1}
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            {d.type}
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            {stringFromMillis(d.timeStart)}
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            {stringFromMillis(d.timeEnd)}
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            {stringFromMillis(d.duration)}
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            {d.title}
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            {d.subtitle}
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            {d.presenter}
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            {d.note}
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            <PublicIconBtn active={d.isPublic} />
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            ' - '
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            ' - '
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            ' - '
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            ' - '
          </div>
          <div className={style.column} style={{ width: `${99 / 14}%` }}>
            ' - '
          </div>
        </div>
      ))}
    </div>
  );
}
