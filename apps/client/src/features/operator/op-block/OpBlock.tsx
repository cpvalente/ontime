import { OntimeBlock } from 'ontime-types';

import style from './OpBlock.module.scss';

interface OpBlockProps {
  data: OntimeBlock;
}

export default function OpBlock({ data }: OpBlockProps) {
  return <div className={style.OpBlock}>{data.title}</div>;
}
