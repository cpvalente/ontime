import { PropsWithChildren } from 'react';
import { IconType } from 'react-icons';
import { Menu as BaseMenu } from '@base-ui/react/menu';

import style from './DropdownMenu.module.scss';

type DropdownMenuItemDivider = { type: 'divider' };
type DropdownMenuItem = {
  type: 'item' | 'destructive';
  label: string;
  icon?: IconType;
  disabled?: boolean;
  onClick: () => void;
};

export type DropdownMenuOption = DropdownMenuItemDivider | DropdownMenuItem;

interface DropdownMenuProps extends BaseMenu.Trigger.Props {
  items: DropdownMenuOption[];
}

export function DropdownMenu({ items, children, ...triggerProps }: PropsWithChildren<DropdownMenuProps>) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger {...triggerProps}>{children}</BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner className={style.positioner} align='start' sideOffset={8}>
          <BaseMenu.Popup className={style.popup}>
            {items.map((item, index) => {
              if (item.type === 'divider') {
                return <BaseMenu.Separator key={index} className={style.separator} />;
              }
              return (
                <BaseMenu.Item
                  key={index}
                  className={style.item}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  data-type={item.type}
                >
                  {item.icon && <item.icon />}
                  {item.label}
                </BaseMenu.Item>
              );
            })}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

interface PositionedDropdownMenuProps {
  items: Array<DropdownMenuItemDivider | DropdownMenuItem>;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

export function PositionedDropdownMenu({ items, isOpen, position, onClose }: PositionedDropdownMenuProps) {
  return (
    <BaseMenu.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BaseMenu.Trigger style={{ position: 'fixed', left: position.x, top: position.y }} aria-hidden />
      <BaseMenu.Portal>
        <BaseMenu.Positioner className={style.positioner} align='start' sideOffset={8} alignOffset={8}>
          <BaseMenu.Popup className={style.popup}>
            {items.map((item, index) => {
              if (item.type === 'divider') {
                return <BaseMenu.Separator key={index} className={style.separator} />;
              }
              return (
                <BaseMenu.Item key={index} className={style.item} onClick={item.onClick} disabled={item.disabled}>
                  {item.icon && <item.icon />}
                  {item.label}
                </BaseMenu.Item>
              );
            })}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
