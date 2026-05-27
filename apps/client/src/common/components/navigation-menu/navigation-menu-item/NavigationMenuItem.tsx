import { PropsWithChildren } from 'react';

import { isKeyEnter } from '../../../utils/keyEvent';
import { cx } from '../../../utils/styleUtils';

import style from './NavigationMenuItem.module.scss';

interface NavigationMenuItemProps {
  active?: boolean;
  className?: string;
  onClick: () => void;
  disable?: boolean;
}

export default function NavigationMenuItem({
  active,
  className,
  children,
  onClick,
  disable,
}: PropsWithChildren<NavigationMenuItemProps>) {
  return (
    <div
      className={cx([style.link, active && style.current, className])}
      tabIndex={0}
      role='button'
      onClick={onClick}
      data-disabled={disable}
      onKeyDown={(event) => {
        if (!!disable && isKeyEnter(event)) {
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}
