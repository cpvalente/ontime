import { useInfoPanel } from '../../common/hooks/useSocket';

import CollapsableInfo from './CollapsableInfo';
import InfoTitles from './InfoTitles';

export default function Info() {
  const data = useInfoPanel();

  const titlesNow = {
    title: data.eventNow?.title || '',
    subtitle: data.eventNow?.subtitle || '',
    presenter: data.eventNow?.presenter || '',
    note: data.eventNow?.note || '',
  };

  const titlesNext = {
    title: data.eventNext?.title || '',
    subtitle: data.eventNext?.subtitle || '',
    presenter: data.eventNext?.presenter || '',
    note: data.eventNext?.note || '',
  };

  return (
    <>
      <CollapsableInfo title='Playing Now'>
        <InfoTitles data={titlesNow} />
      </CollapsableInfo>
      <CollapsableInfo title='Playing Next'>
        <InfoTitles data={titlesNext} />
      </CollapsableInfo>
    </>
  );
}
