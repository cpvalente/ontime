import { IoLocate } from 'react-icons/io5';

import { cx } from '../../../common/utils/styleUtils';

import style from './FollowButton.module.scss';

interface FollowButtonProps {
  isVisible: boolean;
  onClickHandler: () => void;
}

export default function FollowButton(props: FollowButtonProps) {
  const { isVisible, onClickHandler } = props;

  const classes = cx([style.followButton, !isVisible && style.hidden]);

  return (
    <button className={classes} onClick={onClickHandler} type='button'>
      <IoLocate />
      Follow
    </button>
  );
}
