import { CSSProperties } from 'react';

import Empty from './Empty';

import style from './EmptyPage.module.scss';

interface EmptyPageProps {
  text?: string;
  style?: CSSProperties;
}

export default function EmptyPage(props: EmptyPageProps) {
  const { text, ...rest } = props;

  return (
    <div className={style.page}>
      <Empty text={text} {...rest} />
    </div>
  );
}
