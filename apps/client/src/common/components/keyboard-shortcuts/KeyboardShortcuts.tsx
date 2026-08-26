import type { PropsWithChildren } from 'react';

import { cx } from '../../utils/styleUtils';
import Kbd from '../kbd/Kbd';

import style from './KeyboardShortcuts.module.scss';

export function ShortcutGroups({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <div className={cx([style.groups, className])}>{children}</div>;
}

export function ShortcutGroup({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section className={style.group}>
      <h3>{title}</h3>
      <div className={style.list}>{children}</div>
    </section>
  );
}

export function Shortcut({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <div className={style.row}>
      <span className={style.label}>{label}</span>
      <span className={style.keys}>{children}</span>
    </div>
  );
}

export function Combo({ keys }: { keys: string[] }) {
  return (
    <span className={style.combo}>
      {keys.map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
    </span>
  );
}

export function Separator() {
  return <span className={style.separator}>/</span>;
}
