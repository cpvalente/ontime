import style from './OpBlock.module.scss';

type Props = {
  data: any;
};

export default function OpBlock({ data }: Props) {
  return (
    <>
    <div className={style.title}>{data.title}</div>
    </>
  );
}
