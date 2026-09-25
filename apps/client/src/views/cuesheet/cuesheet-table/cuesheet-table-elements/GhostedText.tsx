import { PropsWithChildren } from 'react';

import style from './GhostedText.module.scss';

interface GhostedTextProps {
  multiline?: boolean;
  value: string;
}

export default function GhostedText({ value, multiline }: PropsWithChildren<GhostedTextProps>) {
  'use memo';
  return <div className={`${style.ghostedText} ${multiline ? style.multiline : ''}`}>{value}</div>;
}
