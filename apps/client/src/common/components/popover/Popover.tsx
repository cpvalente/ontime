import { PropsWithChildren } from 'react';
import { Popover } from '@base-ui/react/popover';

import style from './Popover.module.scss';

interface PopoverContentsProps extends Popover.Positioner.Props {
  title?: string;
  className?: string;
}
export default function PopoverContents({
  title,
  className,
  children,
  ...popoverProps
}: PropsWithChildren<PopoverContentsProps>) {
  return (
    <Popover.Portal>
      <Popover.Positioner sideOffset={8} {...popoverProps}>
        <Popover.Popup className={style.popup}>
          {title && <Popover.Title className={style.title}>{title}</Popover.Title>}
          <Popover.Description className={className} render={<div />}>
            {children}
          </Popover.Description>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
}
