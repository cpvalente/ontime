import QRCode from 'react-qr-code';
import { formatDisplay } from '../../../common/dateConfig';
import style from './StageManager.module.css';
import TodayItem from './TodayItem';

export default function StageManager(props) {
  const { pres, publ, lower, title, time, events, selectedId, general } = props;

  // Format messages
  const showPubl = publ.text !== '' && publ.visible;
  const stageTimer =
    time.currentSeconds != null && !isNaN(time.currentSeconds)
      ? formatDisplay(time.currentSeconds, true)
      : '';

  // Keep track of order
  // 0 - events before
  // 1 - running event
  // 2 - future event
  let selectedYet = 0;

  return (
    <div className={style.container__gray}>
      <div className={style.eventTitle}>{general.title}</div>
      <div className={style.nowContainer}>
        <div className={style.label}>Now</div>
        <div className={style.nowTitle}>{title.titleNow}</div>
        <div className={style.nowSubtitle}>{title.subtitleNow}</div>
        <div className={style.nowPresenter}>{title.presenterNow}</div>
      </div>
      <div className={style.nextContainer}>
        <div className={style.label}>Next</div>
        <div className={style.nextTitle}>{title.titleNext}</div>
        <div className={style.nextSubtitle}>{title.subtitleNext}</div>
        <div className={style.nextPresenter}>{title.presenterNext}</div>
      </div>
      <div className={style.todayContainer}>
        <div className={style.label}>Today</div>
        <div className={style.entries}>
          {events.map((e) => {
            if (e.id === selectedId) selectedYet = 1;
            else if (selectedYet === 1) selectedYet = 2;
            return (
              <TodayItem
                selected={selectedYet}
                timeStart={e.timeStart}
                timeEnd={e.timeEnd}
                title={e.title}
              />
            );
          })}
        </div>

        <div className={style.nav}>
          <div className={style.navItem} />
          <div className={style.navItem} />
          <div className={style.navItemSelected} />
        </div>
      </div>

      <div
        className={
          showPubl ? style.publicContainer : style.publicContainerHidden
        }
      >
        <div className={style.label}>Public message</div>
        <div className={style.message}>{publ.text}</div>
      </div>

      <div className={style.clockContainer}>
        <div className={style.label}>Time Now</div>
        <div className={style.clock}>{time.clock}</div>
      </div>

      <div className={style.countdownContainer}>
        <div className={style.label}>Stage Timer</div>
        <div className={style.clock}>{stageTimer}</div>
      </div>

      <div className={style.infoContainer}>
        <div className={style.label}>Info</div>
        <div className={style.infoMessages}>
          <div className={style.info}>{general.backstageInfo}</div>
        </div>
        <div className={style.qr}>
          {general.url != null && general.url !== '' && (
            <QRCode
              value='www.carlosvalente.com'
              size={window.innerWidth / 12}
              level='L'
            />
          )}
        </div>
      </div>
    </div>
  );
}
