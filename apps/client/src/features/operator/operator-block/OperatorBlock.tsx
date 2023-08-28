import style from './OperatorBlock.module.scss';

interface OperatorBlockProps {
  title: string;
}

export default function OperatorBlock({ title }: OperatorBlockProps) {
  return <div className={style.block}>{title}</div>;
}
