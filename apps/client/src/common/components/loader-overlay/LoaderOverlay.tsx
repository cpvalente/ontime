import style from './LoaderOverlay.module.scss';

export default function LoaderOverlay() {
  return (
    <div className={style.overlay}>
      <span className={style.loader} />
    </div>
  );
}
