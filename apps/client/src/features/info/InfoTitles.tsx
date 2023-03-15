import style from './Info.module.scss';

type TitleShape = {
  title: string;
  presenter: string;
  subtitle: string;
  note: string;
};

interface InfoTitleProps {
  data: TitleShape;
}

export default function InfoTitles(props: InfoTitleProps) {
  const { data } = props;
  return (
    <div className={style.labels}>
      <div>
        <span className={style.label}>Title:</span>
        <span className={style.content}>{data.title}</span>
      </div>
      <div>
        <span className={style.label}>Presenter:</span>
        <span className={style.content}>{data.presenter}</span>
      </div>
      <div>
        <span className={style.label}>Subtitle:</span>
        <span className={style.content}>{data.subtitle}</span>
      </div>
      <div>
        <span className={style.label}>Note:</span>
        <span className={style.content}>{data.note}</span>
      </div>
    </div>
  );
}
