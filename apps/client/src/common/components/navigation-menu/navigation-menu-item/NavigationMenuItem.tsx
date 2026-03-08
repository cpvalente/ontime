import { PropsWithChildren } from 'react';

import { isKeyEnter } from '../../../utils/keyEvent';
import { cx } from '../../../utils/styleUtils';

import style from './NavigationMenuItem.module.scss';

interface NavigationMenuItemProps {
  active?: boolean;
  className?: string;
  onClick: () => void;
}

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
        if (isKeyEnter(event)) {
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}
