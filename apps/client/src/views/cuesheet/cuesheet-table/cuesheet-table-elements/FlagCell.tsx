import { TbFlagFilled } from 'react-icons/tb';

import style from './FlagCell.module.scss';

export default function FlagCell() {
  return (
    <div className={style.flag}>
      <TbFlagFilled />
    </div>
  );
}
