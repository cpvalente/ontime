import { ReactNode } from 'react';

import style from './Tag.module.scss';

export default function Tag({ children }: { children: ReactNode }) {
  return <span className={style.tag}>{children}</span>;
}
