import { ReactComponent as Emptyimage } from 'assets/images/empty.svg';
import style from './Empty.module.css';

export default function Empty(props) {
  const { text } = props;
  return (
    <div className={style.emptyContainer}>
      <Emptyimage className={style.empty} />
      <span className={style.text}>{text}</span>
    </div>
  );
}
