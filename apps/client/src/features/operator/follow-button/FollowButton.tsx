import { createPortal } from 'react-dom';
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

  const button = (
    <button className={classes} onClick={onClickHandler} type='button'>
      <IoLocate />
      Follow
    </button>
  );

  // Mirrored viewer roots use a transform, which turns fixed descendants into
  // root-relative elements. Render at the document layer so this control is
  // always positioned against the physical display and its safe area.
  return createPortal(button, document.body);
}
