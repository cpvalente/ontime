import { useEffect, useState } from 'react';
import { useSocket } from '../../app/context/socketContext';
import style from './DefaultPresenter.module.css';

export default function DefaultPresenter() {
  const socket = useSocket();
  const [pres, setPres] = useState({
    text: '',
    visible: false,
  });
  const [publ, setPubl] = useState({
    text: '',
    visible: false,
  });
  const [lower, setLower] = useState({
    text: '',
    visible: false,
  });
  const [timer, setTimer] = useState({
    clock: null,
    currentSeconds: null,
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

    // Handle public messages
    socket.on('messages-public', (data) => {
      setPubl({ ...data });
    });

    // Handle lower third messages
    socket.on('messages-lower', (data) => {
      setLower({ ...data });
    });

    // Handle timer
    socket.on('timer', (data) => {
      setTimer({ ...data });
    });

    // Handle timer
    socket.on('titles', (data) => {
      setTitles({ ...data });
    });

    // Ask for up to date data
    socket.emit('get-messages');

    // Ask for up to data
    socket.emit('get-presenter');

    // Ask for up titles
    socket.emit('get-titles');

    // Clear listeners
    return () => {
      socket.off('messages-public');
      socket.off('messages-presenter');
      socket.off('messages-lower');
      socket.off('timer');
      socket.off('titles');
    };
  }, [socket]);

  return (
    <div className={style.mainContainer}>
      <div className={style.container}>
        <span className={style.label}>Clock: </span>
        <span>{timer.clock}</span>
        <span className={style.label}>Timer: </span>
        <span>{timer.currentSeconds}</span>
        <span className={style.label}>Started: </span>
        <span>{timer.startedAt}</span>
        <span className={style.label}>Finish: </span>
        <span>{timer.expectedFinish}</span>
      </div>
      <div className={style.container}>
        <span className={style.label}>Presenter Message: </span>
        <span>{pres.text}</span>
        <span className={style.label}>Vis: </span>
        <span>{pres.visible ? 'visible' : 'invisible'}</span>
      </div>
      <div className={style.container}>
        <span className={style.label}>Public Message: </span>
        <span>{publ.text}</span>
        <span className={style.label}>Vis: </span>
        <span>{publ.visible ? 'visible' : 'invisible'}</span>
      </div>
      <div className={style.container}>
        <span className={style.label}>Lower third Message: </span>
        <span>{lower.text}</span>
        <span className={style.label}>Vis: </span>
        <span>{lower.visible ? 'visible' : 'invisible'}</span>
      </div>
      <div className={style.container}>
        <span className={style.label}>Title Now: </span>
        <span>{titles.titleNow}</span>
        <span className={style.label}>Subtitle Now: </span>
        <span>{titles.subtitleNow}</span>
        <span className={style.label}>Presenter Now: </span>
        <span>{titles.presenterNow}</span>
      </div>
      <div className={style.container}>
        <span className={style.label}>Title Next: </span>
        <span>{titles.titleNext}</span>
        <span className={style.label}>Subtitle Next: </span>
        <span>{titles.subtitleNext}</span>
        <span className={style.label}>Presenter Next: </span>
        <span>{titles.presenterNext}</span>
      </div>
    </div>
  );
}
