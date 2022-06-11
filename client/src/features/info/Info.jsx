import React, { useEffect,useState } from 'react';
import { useSocket } from 'app/context/socketContext';

import InfoLogger from './InfoLogger';
import InfoNif from './InfoNif';
import InfoTitle from './InfoTitle';

import style from './Info.module.scss';

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
    noteNext: ''
  });
  const [selected, setSelected] = useState('No events');
  const [playback, setPlayback] = useState(null);

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
        const formattedCurrent = `Event ${
          data.index != null ? data.index + 1 : '-'
        }/${data.total ? data.total : '-'}`;
        setSelected(formattedCurrent);
      }
    });

    // Clear listener
    return () => {
      socket.off('titles');
      socket.off('selected');
      socket.off('playstate');
    };
  }, [socket]);

  // prepare data
  const titlesNow = {
    title: titles.titleNow,
    subtitle: titles.subtitleNow,
    presenter: titles.presenterNow,
    note: titles.noteNow
  };

  const titlesNext = {
    title: titles.titleNext,
    subtitle: titles.subtitleNext,
    presenter: titles.presenterNext,
    note: titles.noteNext
  };

  return (
    <>
      <div className={style.main}>
        <span>Running on port 4001</span>
        <span>{selected}</span>
      </div>
      <InfoNif />
      <InfoTitle title='Now' data={titlesNow} roll={playback === 'roll'} />
      <InfoTitle title='Next' data={titlesNext} roll={playback === 'roll'} />
      <InfoLogger />
    </>
  );
}
