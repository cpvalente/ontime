import { millisToMinutes } from '../dateConfig';
import style from './EditableTimer.module.css';

export default function DelayValue(props) {
  const { delay } = props;
  const delayed = delay > 0;
  return (
    <div className={delayed ? style.delayValue : undefined}>
      {delayed && <span>{`+ ${millisToMinutes(delay)}`}</span>}
    </div>
  );
}
