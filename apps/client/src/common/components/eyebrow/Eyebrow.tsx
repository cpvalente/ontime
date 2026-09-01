import { PropsWithChildren } from 'react';

import { cx } from '../../utils/styleUtils';

import style from './Eyebrow.module.scss';

interface EyebrowProps {
  className?: string;
}

export default function Eyebrow({ children, className }: PropsWithChildren<EyebrowProps>) {
  return <span className={cx([style.eyebrow, className])}>{children}</span>;
}
