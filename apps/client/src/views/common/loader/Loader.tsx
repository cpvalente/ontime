import style from './Loader.module.scss';

export default function Loader() {
  return (
    <div className={style.loader}>
      <div className={style.ellipsis}>
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}
