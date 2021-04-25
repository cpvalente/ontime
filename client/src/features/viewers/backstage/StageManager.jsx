import QRCode from 'react-qr-code';
import { formatDisplay } from '../../../common/dateConfig';
import style from './StageManager.module.css';
import Paginator from './Paginator';
import NavLogo from '../../../common/components/nav/NavLogo';
import { useEffect, useState } from 'react';

export default function StageManager(props) {
  const { publ, title, time, backstageEvents, selectedId, general } = props;
  const [filteredEvents, setFilteredEvents] = useState(null);

  // calculate delays if any
  useEffect(() => {
    if (backstageEvents == null) return;

    let events = [...backstageEvents];

    // Add running delay
    let delay = 0;
    events.forEach((e) => {
      if (e.type === 'block') delay = 0;
      else if (e.type === 'delay') delay = delay + e.duration;
      else if (e.type === 'event' && delay > 0) {
        e.timeStart += delay;
        e.timeEnd += delay;
      }
    });

    // filter just events
    let filtered = events.filter((e) => e.type === 'event');

    setFilteredEvents(filtered);
  }, [backstageEvents]);

  // Format messages
  const showPubl = publ.text !== '' && publ.visible;
  const stageTimer =
    time.currentSeconds != null && !isNaN(time.currentSeconds)
      ? formatDisplay(time.currentSeconds, true)
      : '';

  return (
    <div className={style.container__gray}>
      <NavLogo />

      <div className={style.eventTitle}>{general.title}</div>
      {title.showNow && (
        <div className={style.nowContainer}>
          <div className={style.label}>Now</div>
          <div className={style.nowTitle}>{title.titleNow}</div>
          <div className={style.nowSubtitle}>{title.subtitleNow}</div>
          <div className={style.nowPresenter}>{title.presenterNow}</div>
        </div>
      )}

      {title.showNext && (
        <div className={style.nextContainer}>
          <div className={style.label}>Next</div>
          <div className={style.nextTitle}>{title.titleNext}</div>
          <div className={style.nextSubtitle}>{title.subtitleNext}</div>
          <div className={style.nextPresenter}>{title.presenterNext}</div>
        </div>
      )}

      <div className={style.todayContainer}>
        <div className={style.label}>Today</div>
        <div className={style.entriesContainer}>
          <Paginator selectedId={selectedId} events={filteredEvents} />
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
