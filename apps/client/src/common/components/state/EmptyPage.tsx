import { CSSProperties } from 'react';

import Empty from './Empty';

import style from './EmptyPage.module.scss';

interface EmptyPageProps {
  text?: string;
  injectedStyles?: CSSProperties;
}

export default function EmptyPage({ text, injectedStyles }: EmptyPageProps) {
  return (
    <div className={style.page}>
      <Empty text={text} injectedStyles={injectedStyles} />
    </div>
  );
}
