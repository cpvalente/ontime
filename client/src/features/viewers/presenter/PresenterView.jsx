import style from './PresenterView.module.css';

export default function PresenterView() {
  return (
    <div className={style.container__gray}>
      <div className={style.nowContainer}>
        <div className={style.label}>Now</div>
        <div className={style.title}>Are hamburguers real</div>
        <div className={style.subtitle}>A day in the life....</div>
        <div className={style.presenter}>Carlos Valente</div>
      </div>

      <div className={style.nextContainer}>
        <div className={style.label}>Up Next</div>
        <div className={style.title}>Up to midnight</div>
        <div className={style.subtitle}></div>
        <div className={style.presenter}>Veronica</div>
      </div>

      {/* <div className={style.messageOverlayActive}>
        <div className={style.message}>Remember to smile</div>
      </div> */}

      <div className={style.mainContainer}>
        <div className={style.countdown}>01:03</div>
        <div className={style.progress}>
          <div className={style.progressed}></div>
        </div>
      </div>

      <div className={style.mainContainer}>
        <div className={style.finished}>TIME UP</div>
      </div>

      <div className={style.clockContainer}>
        <div className={style.label}>Time Now</div>
        <div className={style.clock}>11:00:23</div>
      </div>
    </div>
  );
}
