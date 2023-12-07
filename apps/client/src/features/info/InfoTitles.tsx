import style from './Info.module.scss';

interface InfoTitleProps {
  title: string;
  presenter: string;
  subtitle: string;
  note: string;
  showTimeToNext?: boolean;
}

function TimeToNext() {
  return (
    <div>
      <span className={style.label}>Time to next:</span>
      <span className={style.content}>00:00:00</span>
    </div>
  );
}

export default function InfoTitles(props: InfoTitleProps) {
  const { title, presenter, subtitle, note, showTimeToNext } = props;
  return (
    <div className={style.labels}>
      {showTimeToNext && <TimeToNext />}
      <div>
        <span className={style.label}>Title:</span>
        <span className={style.content}>{title}</span>
      </div>
      <div>
        <span className={style.label}>Presenter:</span>
        <span className={style.content}>{presenter}</span>
      </div>
      <div>
        <span className={style.label}>Subtitle:</span>
        <span className={style.content}>{subtitle}</span>
      </div>
      <div>
        <span className={style.label}>Note:</span>
        <span className={style.content}>{note}</span>
      </div>
    </div>
  );
}
