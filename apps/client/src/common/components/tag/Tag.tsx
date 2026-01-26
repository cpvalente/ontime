import { PropsWithChildren } from 'react';

import style from './Tag.module.scss';

interface TagProps {
  className?: string;
}

export default function Tag({ className, children }: PropsWithChildren<TagProps>) {
  return <span className={`${style.tag} ${className || ''}`}>{children}</span>;
}
