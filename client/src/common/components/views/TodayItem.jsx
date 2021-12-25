import { stringFromMillis } from 'ontime-server/utils/time';
import style from './Paginator.module.css';
export default function TodayItem(props) {
  const { selected, timeStart, timeEnd, title, backstageEvent } = props;

  // Format timers
  const start = stringFromMillis(timeStart, false) || '';
  const end = stringFromMillis(timeEnd, false) || '';

  // select styling
  let selectStyle = style.entryPast;
  if (selected === 1) selectStyle = style.entryNow;
  else if (selected === 2) selectStyle = style.entryFuture;
  return (
    <div className={selectStyle}>
      <div
        className={`${style.entryTimes} ${
          backstageEvent ? style.backstage : undefined
        }`}
      >{`${start} · ${end}`}</div>
      <div className={style.entryTitle}>{title}</div>
      {backstageEvent && <div className={style.backstageInd}/>}
    </div>
  );
}
