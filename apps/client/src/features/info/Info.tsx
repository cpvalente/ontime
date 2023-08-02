import { useInfoPanel } from '../../common/hooks/useSocket';

import InfoHeader from './info-header/InfoHeader';
import CollapsableInfo from './CollapsableInfo';
import InfoLogger from './InfoLogger';
import InfoNif from './InfoNif';
import InfoTitles from './InfoTitles';

export default function Info() {
  const data = useInfoPanel();

  const titlesNow = {
    title: data.titles.titleNow || '',
    subtitle: data.titles.subtitleNow || '',
    presenter: data.titles.presenterNow || '',
    note: data.titles.noteNow || '',
  };

  const titlesNext = {
    title: data.titles.titleNext || '',
    subtitle: data.titles.subtitleNext || '',
    presenter: data.titles.presenterNext || '',
    note: data.titles.noteNext || '',
  };

  const selected = !data.numEvents
    ? 'No events'
    : `Event ${data.selectedEventIndex !== null ? data.selectedEventIndex + 1 : '-'} / ${
        data.numEvents ? data.numEvents : '-'
      }`;

  return (
    <>
      <InfoHeader selected={selected} />
      <CollapsableInfo title='Network Info'>
        <InfoNif />
      </CollapsableInfo>
      <CollapsableInfo title='Playing Now'>
        <InfoTitles data={titlesNow} />
      </CollapsableInfo>
      <CollapsableInfo title='Playing Next'>
        <InfoTitles data={titlesNext} />
      </CollapsableInfo>
      <CollapsableInfo title='Log'>
        <InfoLogger />
      </CollapsableInfo>
    </>
  );
}
