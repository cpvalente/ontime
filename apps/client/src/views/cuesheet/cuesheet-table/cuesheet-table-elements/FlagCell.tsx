import { TbFlagFilled } from 'react-icons/tb';

import style from './FlagCell.module.scss';

export default function FlagCell() {
  'use memo';
  return (
    <div className={style.flag}>
      <TbFlagFilled />
    </div>
  );
}
