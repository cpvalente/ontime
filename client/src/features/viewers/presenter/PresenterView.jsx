import { useEffect, useState } from 'react';
import { useSocket } from '../../../app/context/socketContext';
import Countdown from '../../../common/components/countdown/Countdown';
import MyProgressBar from '../../../common/components/myProgressBar/MyProgressBar';
import { stringFromMillis } from '../../../common/dateConfig';
import style from './PresenterView.module.css';

export default function PresenterView() {
  const socket = useSocket();
  const [pres, setPres] = useState({
    text: '',
    visible: false,
  });
  const [timer, setTimer] = useState({
    clock: null,
    currentSeconds: null,
    durationSeconds: null,
    startedAt: null,
    expectedFinish: null,
  });
  const [titles, setTitles] = useState({
    titleNow: '',
    subtitleNow: '',
    presenterNow: '',
    titleNext: '',
    subtitleNext: '',
    presenterNext: '',
  });
  // Ask for update on load
  useEffect(() => {
    if (socket == null) return;

    // Handle presenter messages
    socket.on('messages-presenter', (data) => {
      setPres({ ...data });
    });

    // Handle timer
    socket.on('timer', (data) => {
      setTimer({ ...data });
    });

    // Handle timer
    socket.on('titles', (data) => {
      setTitles({ ...data });
    });

    // Ask for up to data
    socket.emit('get-presenter');

    // Ask for up titles
    socket.emit('get-titles');

    // Clear listeners
    return () => {
      socket.off('messages-presenter');
      socket.off('timer');
      socket.off('titles');
    };
  }, [socket]);

  // is there a next field?
  let showNext = true;
  if (!titles.titleNext && !titles.subtitleNext && !titles.presenterNext)
    showNext = false;

  // should show message overlay
  let showOverlay = pres.visible && pres.text !== '';

  // is timer finished
  let finished = timer.currentSeconds <= 0;

  // get clock
  let clock = stringFromMillis(timer.clock);

  return (
    <div
      className={
        finished ? style.container__grayFinished : style.container__gray
      }
    >
      <div
        className={
          showOverlay ? style.messageOverlayActive : style.messageOverlay
        }
      >
        <div className={style.message}>{pres.text}</div>
      </div>

      <div className={style.clockContainer}>
        <div className={style.label}>Time Now</div>
        <div className={style.clock}>{clock}</div>
      </div>

      <div className={style.timerContainer}>
        {finished ? (
          <div className={style.finished}>TIME UP</div>
        ) : (
          <div className={style.countdown}>
            <Countdown time={timer.currentSeconds} hideZeroHours />
          </div>
        )}
      </div>

      {!finished && (
        <div className={style.progressContainer}>
          <MyProgressBar
            now={timer.currentSeconds}
            complete={timer.durationSeconds}
          />
        </div>
      )}

      <div className={style.nowContainer}>
        <div className={style.label}>Now</div>
        <div className={style.title}>{titles.titleNow}</div>
        <div className={style.subtitle}>{titles.subtitleNow}</div>
        <div className={style.presenter}>{titles.presenterNow}</div>
      </div>

      {showNext && (
        <div className={style.nextContainer}>
          <div className={style.label}>Next</div>
          <div className={style.title}>{titles.titleNext}</div>
          <div className={style.subtitle}>{titles.subtitleNext}</div>
          <div className={style.presenter}>{titles.presenterNext}</div>
        </div>
      )}
    </div>
  );
}
