import { PropsWithChildren } from 'react';

import style from './Kbd.module.scss';

export default function Kbd({ children }: PropsWithChildren) {
  return <kbd className={style.kbd}>{children}</kbd>;
}
