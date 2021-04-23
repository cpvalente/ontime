import Countdown from '../../../common/components/countdown/Countdown';
import MyProgressBar from '../../../common/components/myProgressBar/MyProgressBar';
import NavLogo from '../../../common/components/nav/NavLogo';
import style from './PresenterView.module.css';

export default function PresenterView(props) {
  const { pres, publ, lower, title, time } = props;

  let showOverlay = pres.text !== '' && pres.visible;

  return (
    <div
      className={
        time.finished ? style.container__grayFinished : style.container__gray
      }
    >
      <div
        className={
          showOverlay ? style.messageOverlayActive : style.messageOverlay
        }
      >
        <div className={style.message}>{pres.text}</div>
      </div>

      <NavLogo />

      <div className={style.clockContainer}>
        <div className={style.label}>Time Now</div>
        <div className={style.clock}>{time.clock}</div>
      </div>

      <div className={style.timerContainer}>
        {time.finished ? (
          <div className={style.finished}>TIME UP</div>
        ) : (
          <div className={style.countdown}>
            <Countdown time={time.currentSeconds} hideZeroHours />
          </div>
        )}
      </div>

      {!time.finished && (
        <div className={style.progressContainer}>
          <MyProgressBar
            now={time.currentSeconds}
            complete={time.durationSeconds}
            showElapsed
          />
        </div>
      )}

      <div className={style.nowContainer}>
        <div className={style.label}>Now</div>
        <div className={style.title}>{title.titleNow}</div>
        <div className={style.subtitle}>{title.subtitleNow}</div>
        <div className={style.presenter}>{title.presenterNow}</div>
      </div>

      {title.showNext && (
        <div className={style.nextContainer}>
          <div className={style.label}>Next</div>
          <div className={style.title}>{title.titleNext}</div>
          <div className={style.subtitle}>{title.subtitleNext}</div>
          <div className={style.presenter}>{title.presenterNext}</div>
        </div>
      )}
    </div>
  );
}
