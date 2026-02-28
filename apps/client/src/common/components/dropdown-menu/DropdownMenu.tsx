import { Menu as BaseMenu } from '@base-ui/react/menu';
import { PropsWithChildren } from 'react';
import { IconType } from 'react-icons';

import style from './DropdownMenu.module.scss';

type DropdownMenuItemDivider = { type: 'divider' };
type DropdownMenuItem = {
  type: 'item' | 'destructive';
  label: string;
  description?: string;
  icon?: IconType;
  disabled?: boolean;
  onClick: () => void;
  shortcut?: string;
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
                  <span className={style.content}>
                    <span className={style.label}>
                      {item.icon && <item.icon />}
                      {item.label}
                    </span>
                    {item.description && <span className={style.description}>{item.description}</span>}
                  </span>
                  {item.shortcut && <span className={style.shortcut}>{item.shortcut}</span>}
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
                  <span className={style.content}>
                    <span className={style.label}>
                      {item.icon && <item.icon />}
                      {item.label}
                    </span>
                    {item.description && <span className={style.description}>{item.description}</span>}
                  </span>
                  {item.shortcut && <span className={style.shortcut}>{item.shortcut}</span>}
                </BaseMenu.Item>
              );
            })}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
