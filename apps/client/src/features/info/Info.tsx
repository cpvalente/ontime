import { useInfoPanel } from '../../common/hooks/useSocket';
import { useEditorSettings } from '../../common/stores/editorSettings';

import CollapsableInfo from './CollapsableInfo';
import InfoLogger from './InfoLogger';
import InfoNif from './InfoNif';
import InfoTitles from './InfoTitles';

export default function Info() {
  const data = useInfoPanel();
  const showNif = useEditorSettings((state) => state.eventSettings.showNif);

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
      {showNif && (
        <CollapsableInfo title='Network Info'>
          <InfoNif />
        </CollapsableInfo>
      )}
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
