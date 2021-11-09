import { useState, useEffect } from 'react';
import { useSocket } from 'app/context/socketContext';
import style from './Info.module.css';
import InfoTitle from './InfoTitle';
import InfoLogger from './InfoLogger';
import InfoNif from './InfoNif';

export default function Info() {
  const socket = useSocket();
  const [titles, setTitles] = useState({
    titleNow: '',
    subtitleNow: '',
    presenterNow: '',
    noteNow: '',
    titleNext: '',
    subtitleNext: '',
    presenterNext: '',
    noteNext: '',
  });
  const [selected, setSelected] = useState('No events');
  const [playback, setPlayback] = useState(null);
  const logData = [];

  // handle incoming messages
  useEffect(() => {
    if (socket == null) return;

    // Ask for titles
    socket.emit('get-titles');

    // Handle titles
    socket.on('titles', (data) => {
      setTitles(data);
    });

    // Handle playstate
    socket.on('playstate', (data) => {
      setPlayback(data);
    });

    // Ask for selection data
    socket.emit('get-selected');

    // Handle selection data
    socket.on('selected', (data) => {
      if (data.total === 0 || data.total == null) {
        setSelected('No events');
      } else {
        const formatedCurrent = `Event ${
          data.index != null ? data.index + 1 : '-'
        }/${data.total != null ? data.total : '-'}`;
        setSelected(formatedCurrent);
      }
    });

    // Clear listener
    return () => {
      socket.off('titles');
      socket.off('selected');
      socket.off('playstate');
    };
  }, [socket]);

  // TODO: Put this in use effect
  // prepare data
  const titlesNow = {
    title: titles.titleNow,
    subtitle: titles.subtitleNow,
    presenter: titles.presenterNow,
    note: titles.noteNow,
  };

  const titlesNext = {
    title: titles.titleNext,
    subtitle: titles.subtitleNext,
    presenter: titles.presenterNext,
    note: titles.noteNext,
  };

  return (
    <>
      <div className={style.main}>
        <span>{`Running on port 4001`}</span>
        <span>{selected}</span>
      </div>
      {/* <InfoLogger logData={logData} /> */}
      <InfoNif />
      <InfoTitle title={'Now'} data={titlesNow} roll={playback === 'roll'} />
      <InfoTitle title={'Next'} data={titlesNext} roll={playback === 'roll'} />
    </>
  );
}
