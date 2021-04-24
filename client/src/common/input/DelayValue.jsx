import { millisToMinutes } from '../dateConfig';
import style from '../../features/editors/list/Block.module.css';

export default function DelayValue(props) {
  const { delay } = props;
  const delayed = delay > 0;
  return (
    <div className={style.delayValue}>
      {delayed && <span>{`+ ${millisToMinutes(delay)}`}</span>}
    </div>
  );
}
