import { useEffect } from 'react';
import { useSocket } from 'app/context/socketContext';
import style from './Info.module.css';
import InfoTitle from './InfoTitle';
import InfoLogger from './InfoLogger';
import InfoNif from './InfoNif';
import { useState } from 'react';

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
  const [selected, setSelected] = useState('-/-');
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

    // Ask for selection data
    socket.emit('get-selected');

    // Handle selection data
    socket.on('selected', (data) => {
      const formatedCurrent = `Event ${
        data.index != null ? data.index + 1 : '-'
      }/${data.total != null ? data.total : '-'}`;

      setSelected(formatedCurrent);
    });

    // Clear listener
    return () => {
      socket.off('titles');
      socket.off('selected');
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
      <div className={style.main}>{selected}</div>
      <InfoLogger logData={logData} />
      <InfoNif />
      <InfoTitle title={'Now'} data={titlesNow} />
      <InfoTitle title={'Next'} data={titlesNext} />
    </>
  );
}
