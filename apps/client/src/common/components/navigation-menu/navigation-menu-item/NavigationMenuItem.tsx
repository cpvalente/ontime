import { PropsWithChildren, ReactNode } from 'react';
import { IoLockClosedOutline } from 'react-icons/io5';

import { isKeyEnter, isKeySpace } from '../../../utils/keyEvent';
import { cx } from '../../../utils/styleUtils';

import style from './NavigationMenuItem.module.scss';

interface NavigationMenuItemProps {
  active?: boolean;
  className?: string;
  icon?: ReactNode;
  /** the destination is behind the app PIN, when one is set */
  isProtected?: boolean;
  trailing?: ReactNode;
  onClick: () => void;
}

/** A row in the navigation menu, and the single place which decides how a row reacts to input */
export default function NavigationMenuItem({
  active,
  className,
  icon,
  isProtected,
  trailing,
  children,
  onClick,
}: PropsWithChildren<NavigationMenuItemProps>) {
  return (
    <div
      className={cx([style.link, active && style.current, className])}
      tabIndex={0}
      role='button'
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (isKeyEnter(event) || isKeySpace(event)) {
          event.preventDefault();
          event.stopPropagation();
          onClick();
        }
      }}
    >
      <span className={style.icon}>{icon}</span>
      <span className={style.label}>{children}</span>
      {isProtected && (
        <span className={style.protected} title='May require PIN'>
          <IoLockClosedOutline aria-hidden />
        </span>
      )}
      {trailing}
    </div>
  );
}
