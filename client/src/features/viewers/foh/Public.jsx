import QRCode from 'react-qr-code';
import style from './Public.module.css';
import Paginator from '../../../common/components/views/Paginator';
import NavLogo from '../../../common/components/nav/NavLogo';

export default function StageManager(props) {
  const { publ, title, time, events, selectedId, general } = props;

  // Format messages
  const showPubl = publ.text !== '' && publ.visible;

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
          <Paginator selectedId={selectedId} events={events} />
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

      <div className={style.infoContainer}>
        <div className={style.label}>Info</div>
        <div className={style.infoMessages}>
          <div className={style.info}>{general.publicInfo}</div>
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
