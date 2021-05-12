import { stringFromMillis } from 'common/dateConfig';
import style from './Paginator.module.css';
export default function TodayItem(props) {
  const { selected, timeStart, timeEnd, title } = props;

  // Format timers
  const start = stringFromMillis(timeStart, false) || '';
  const end = stringFromMillis(timeEnd, false) || '';

  // select styling
  let selectStyle = style.entryPast;
  if (selected === 1) selectStyle = style.entryNow;
  else if (selected === 2) selectStyle = style.entryFuture;
  return (
    <div className={selectStyle}>
      <div className={style.entryStart}>{start}</div>
      <div className={style.entryEnd}>{end}</div>
      <div className={style.entryTitle}>{title}</div>
    </div>
  );
}
