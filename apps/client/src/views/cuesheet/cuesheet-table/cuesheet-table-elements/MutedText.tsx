import { PropsWithChildren } from 'react';

import { cx } from '../../../../common/utils/styleUtils';

import style from './MutedText.module.scss';

interface MutedTextProps {
  numeric?: boolean;
  title?: string;
}

export default function MutedText({ numeric, title, children }: PropsWithChildren<MutedTextProps>) {
  return (
    <span className={cx([style.muted, numeric && style.numeric])} title={title}>
      {children}
    </span>
  );
}
