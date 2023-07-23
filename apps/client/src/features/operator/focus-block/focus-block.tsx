import { BiTargetLock } from '@react-icons/all-files/bi/BiTargetLock';

import style from './focusBlock.module.scss';

export default function FocusBlock() {
  return (
    <button className={style.focusBlock}>
      <div className={style.focusButton}>
        <BiTargetLock size={20} />
        Follow
      </div>
    </button>
  );
}
