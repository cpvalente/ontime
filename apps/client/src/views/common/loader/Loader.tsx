import style from './Loader.module.scss';

export default function Loader() {
  return (
    <div className={style.loader} role='status' aria-label='Loading Ontime'>
      <div className={style.dots} aria-hidden='true'>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
