import React from 'react';

import { useInfoProvider } from '../../common/hooks/useSocketProvider';

import InfoLogger from './InfoLogger';
import InfoNif from './InfoNif';
import InfoTitle from './InfoTitle';

import style from './Info.module.scss';

export default function Info() {
  const data = useInfoProvider();

  const titlesNow = {
    title: data.titles.titleNow,
    subtitle: data.titles.subtitleNow,
    presenter: data.titles.presenterNow,
    note: data.titles.noteNow,
  };

  const titlesNext = {
    title: data.titles.titleNext,
    subtitle: data.titles.subtitleNext,
    presenter: data.titles.presenterNext,
    note: data.titles.noteNext,
  };

  const selected = !data.numEvents
    ? 'No events'
    : `Event ${data.selectedEventIndex != null ? data.selectedEventIndex + 1 : '-'}/${
        data.numEvents ? data.numEvents : '-'
      }`;

  return (
    <>
      <div className={style.main}>
        <span>Running on port 4001</span>
        <span>{selected}</span>
      </div>
      <InfoNif />
      <InfoTitle title='Now' data={titlesNow} roll={data.playback === 'roll'} />
      <InfoTitle title='Next' data={titlesNext} roll={data.playback === 'roll'} />
      <InfoLogger />
    </>
  );
}
