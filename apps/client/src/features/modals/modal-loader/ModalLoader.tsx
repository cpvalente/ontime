import style from './ModalLoader.module.scss';

export default function ModalLoader() {
  return (
    <div className={style.screenLoader}>
      <span className={style.loader} />
    </div>
  );
}
