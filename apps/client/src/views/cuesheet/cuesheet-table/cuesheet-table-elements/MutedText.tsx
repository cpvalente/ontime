import { PropsWithChildren } from 'react';

import { cx } from '../../../../common/utils/styleUtils';

import style from './MutedText.module.scss';

interface MutedTextProps {
  numeric?: boolean;
}

export default function MutedText({ numeric, children }: PropsWithChildren<MutedTextProps>) {
  return <span className={cx([style.muted, numeric && style.numeric])}>{children}</span>;
}
