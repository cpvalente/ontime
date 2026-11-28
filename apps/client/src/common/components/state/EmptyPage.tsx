import { CSSProperties, PropsWithChildren } from 'react';

import Empty from './Empty';

import style from './EmptyPage.module.scss';

interface EmptyPageProps {
  text?: string;
  injectedStyles?: CSSProperties;
  variant?: 'error';
}

export default function EmptyPage({ text, injectedStyles, variant, children }: PropsWithChildren<EmptyPageProps>) {
  return (
    <div className={style.page}>
      <Empty text={text} injectedStyles={injectedStyles} variant={variant}>
        {children}
      </Empty>
    </div>
  );
}
