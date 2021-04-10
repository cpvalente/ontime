import style from './EditableTimer.module.css';

export default function DelayValue(props) {
  const { delay } = props;
  const delayed = delay > 0;
  return (
    <div className={delayed && style.delayValue}>
      {delayed && <span>{`+ ${delay}`}</span>}
    </div>
  );
}
