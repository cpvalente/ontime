import { PropsWithChildren } from 'react';

import style from './GhostedText.module.scss';

interface GhostedTextProps {
  multiline?: boolean;
}

export default function GhostedText({ children, multiline }: PropsWithChildren<GhostedTextProps>) {
  return <div className={`${style.ghostedText} ${multiline ? style.multiline : ''}`}>{children}</div>;
}
