import style from './OpBlock.module.scss';
import { OntimeBlock } from 'ontime-types';

interface OpBlockProps {
  data: OntimeBlock;
}

export default function OpBlock({ data }: OpBlockProps) {
  return <div className={style.OpBlock}>{data.title}</div>;
}
