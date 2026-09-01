import { ReactNode } from 'react';

import Switch from '../../switch/Switch';

import style from './NavigationMenuItem.module.scss';

interface NavigationMenuToggleProps {
  checked: boolean;
  icon: ReactNode;
  label: string;
  onToggle: () => void;
}

/** A menu row which reflects, and toggles, an on/off state */
export default function NavigationMenuToggle({ checked, icon, label, onToggle }: NavigationMenuToggleProps) {
  return (
    <label className={style.link}>
      {icon}
      <span className={style.label}>{label}</span>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </label>
  );
}
