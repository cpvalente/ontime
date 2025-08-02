import { PropsWithChildren } from 'react';

import style from './GhostedText.module.scss';

export default function GhostedText({ children }: PropsWithChildren) {
  return <div className={style.ghostedText}>{children}</div>;
}
