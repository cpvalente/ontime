import { stringFromMillis } from '../../../common/dateConfig';
import style from './StageManager.module.css';
export default function TodayItem(props) {
  const { selected, timeStart, timeEnd, title } = props;

  // Format timers
  const start = timeStart ? stringFromMillis(timeStart, false) : '';
  const end = timeEnd ? stringFromMillis(timeEnd, false) : '';

  // select styling
  let selectStyle = style.entryPast;
  if (selected === 1) selectStyle = style.entryNow;
  else if (selected === 2) selectStyle = style.entryFuture;
  return (
    <div class={selectStyle}>
      <div className={style.entryStart}>{start}</div>
      <div className={style.entryEnd}>{end}</div>
      <div className={style.entryTitle}>{title}</div>
    </div>
  );
}
