import style from './PresenterView.module.css';

export default function PresenterSimple() {
  return (
    <div className={style.container__gray}>

      {/* <div className={style.messageOverlayActive}>
        <div className={style.message}>Remember to smile</div>
      </div> */}

      <div className={style.mainContainer}>
        <div className={style.countdownBig}>01:03</div>
        <div className={style.progress}>
          <div className={style.progressed}></div>
        </div>
      </div>

      {/* <div className={style.mainContainer}>
        <div className={style.finished}>TIME UP</div>
      </div> */}

      <div className={style.clockContainer}>
        <div className={style.label}>Time Now</div>
        <div className={style.clock}>11:00:23</div>
      </div>
    </div>
  );
}
