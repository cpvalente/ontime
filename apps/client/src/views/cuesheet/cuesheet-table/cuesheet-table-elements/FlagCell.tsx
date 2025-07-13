import { IoFlag } from 'react-icons/io5';

import style from './FlagCell.module.scss';

export default function FlagCell() {
  return (
    <div className={style.flag}>
      <IoFlag />
    </div>
  );
}
