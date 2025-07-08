import { ReactNode } from 'react';
import { Menu as BaseMenu } from '@base-ui-components/react/menu';

import style from './Menu.module.scss';

type MenuItemDivider = { type: 'divider' };
type MenuItem = {
  type: 'item';
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick: () => void;
};

interface MenuProps {
  items: Array<MenuItemDivider | MenuItem>;
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function Menu({ items, isOpen, position, onClose }: MenuProps) {
  return (
    <BaseMenu.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BaseMenu.Trigger
        style={{ position: 'absolute', left: position.x, top: position.y, pointerEvents: 'none' }}
        aria-hidden
      />
      <BaseMenu.Portal>
        <BaseMenu.Positioner className={style.positioner} align='start' sideOffset={8}>
          <BaseMenu.Popup className={style.popup}>
            {items.map((item, index) => {
              if (item.type === 'divider') {
                return <BaseMenu.Separator key={index} className={style.separator} />;
              }
              return (
                <BaseMenu.Item key={index} className={style.item} onClick={item.onClick} disabled={item.disabled}>
                  {item.icon} {item.label}
                </BaseMenu.Item>
              );
            })}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
