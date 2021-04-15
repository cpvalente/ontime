import QRCode from 'react-qr-code';
import style from './StageManager.module.css';

export default function StageManager() {
  return (
    <div className={style.container__gray}>
      <div className={style.eventTitle}>Todays event name</div>

      <div className={style.nowContainer}>
        <div className={style.label}>Now</div>
        <div className={style.nowTitle}>Are hamburguers real</div>
        <div className={style.nowSubtitle}>A day in the life....</div>
        <div className={style.nowPresenter}>Carlos Valente</div>
      </div>

      <div className={style.nextContainer}>
        <div className={style.label}>Up Next</div>
        <div className={style.nextTitle}>Up to midnight</div>
        <div className={style.nextSubtitle}></div>
        <div className={style.nextPresenter}>Veronica</div>
      </div>

      <div className={style.todayContainer}>
        <div className={style.label}>Today</div>
        <div className={style.entries}>
          <div class={style.entryPast}>
            <div className={style.entryStart}>10:30</div>
            <div className={style.entryEnd}>10:45</div>
            <div className={style.entryTitle}>A dress to the nation</div>
          </div>
          <div class={style.entryPast}>
            <div className={style.entryStart}>10:30</div>
            <div className={style.entryEnd}>10:45</div>
            <div className={style.entryTitle}>A dress to the nation</div>
          </div>
          <div class={style.entryPast}>
            <div className={style.entryStart}>10:30</div>
            <div className={style.entryEnd}>10:45</div>
            <div className={style.entryTitle}>A dress to the nation</div>
          </div>
          <div class={style.entryNow}>
            <div className={style.entryStart}>10:30</div>
            <div className={style.entryEnd}>10:45</div>
            <div className={style.entryTitle}>Are burguers real</div>
          </div>
          <div class={style.entryFuture}>
            <div className={style.entryStart}>10:30</div>
            <div className={style.entryEnd}>10:45</div>
            <div className={style.entryTitle}>Up to midnight</div>
          </div>
        </div>
        <div className={style.nav}>
          <div className={style.navItem} />
          <div className={style.navItem} />
          <div className={style.navItemSelected} />
        </div>
      </div>

      <div className={style.clockContainer}>
        <div className={style.label}>Time Now</div>
        <div className={style.clock}>11:00:23</div>
      </div>

      <div className={style.countdownContainer}>
        <div className={style.label}>Countdown</div>
        <div className={style.clock}>00:23</div>
      </div>

      <div className={style.infoContainer}>
        <div className={style.label}>Info</div>
        <div className={style.infoMessages}>
          <div className={style.info}>Water in the public bathroom</div>
          <div className={style.info}>Wifi Password: bemywifi</div>
          <div className={style.info}>Have a nice day</div>
        </div>
        <div className={style.qr}>
          <QRCode
            value='www.carlosvalente.com'
            size={window.innerWidth / 10}
            level='L'
          />
        </div>
      </div>
    </div>
  );
}
