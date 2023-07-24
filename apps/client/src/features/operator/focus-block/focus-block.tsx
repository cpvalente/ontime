import { IoLocate } from '@react-icons/all-files/io5/IoLocate';

import style from './focusBlock.module.scss';

export default function FocusBlock() {
  const handleClick = () => console.log('click follow');

  // @arihavn, can we find a way to have a single button here, no need for the div
  return (
    <div className={style.focusBlock}>
      <button className={style.focusButton} onClick={handleClick}>
        <IoLocate size={16} />
        Follow
      </button>
    </div>
  );
}
