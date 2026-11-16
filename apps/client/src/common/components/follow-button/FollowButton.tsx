import { createPortal } from 'react-dom';
import { IoLocate } from 'react-icons/io5';

import { cx } from '../../utils/styleUtils';
import Tooltip from '../tooltip/Tooltip';

import style from './FollowButton.module.scss';

interface FollowButtonProps {
  isVisible: boolean;
  onClickHandler: () => void;
  /** viewport floats over the whole display, panel floats over the nearest positioned container */
  placement?: 'viewport' | 'panel';
  tooltip?: string;
}

export default function FollowButton({
  isVisible,
  onClickHandler,
  placement = 'viewport',
  tooltip,
}: FollowButtonProps) {
  // a hidden button stays mounted for its transition, inert keeps it out of focus and the accessibility tree
  const buttonProps = {
    className: cx([style.followButton, style[placement], !isVisible && style.hidden]),
    onClick: onClickHandler,
    inert: !isVisible,
    children: (
      <>
        <IoLocate aria-hidden />
        Follow
      </>
    ),
  };

  const button = tooltip ? (
    <Tooltip text={tooltip} render={<button type='button' />} {...buttonProps} />
  ) : (
    <button type='button' {...buttonProps} />
  );

  if (placement === 'panel') {
    return button;
  }

  // Mirrored viewer roots use a transform, which turns fixed descendants into
  // root-relative elements. Render at the document layer so this control is
  // always positioned against the physical display and its safe area.
  return createPortal(button, document.body);
}
