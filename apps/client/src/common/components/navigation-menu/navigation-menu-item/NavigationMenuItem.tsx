import { PropsWithChildren } from 'react';

import { isKeyEnter, isKeySpace } from '../../../utils/keyEvent';
import { cx } from '../../../utils/styleUtils';

import style from './NavigationMenuItem.module.scss';

interface NavigationMenuItemProps {
  active?: boolean;
  className?: string;
  onClick: () => void;
}

/** A row in the navigation menu, and the single place which decides how a row reacts to input */
export default function NavigationMenuItem({
  active,
  className,
  children,
  onClick,
}: PropsWithChildren<NavigationMenuItemProps>) {
  return (
    <div
      className={cx([style.link, active && style.current, className])}
      tabIndex={0}
      role='button'
      onClick={onClick}
      onKeyDown={(event) => {
        if (isKeyEnter(event) || isKeySpace(event)) {
          event.preventDefault();
          event.stopPropagation();
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}
