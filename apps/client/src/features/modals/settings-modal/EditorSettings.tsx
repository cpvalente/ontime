import { Switch } from '@chakra-ui/react';

import { useEditorSettings } from '../../../common/stores/editorSettings';
import ModalSplitInput from '../ModalSplitInput';

import style from './SettingsModal.module.scss';

export default function EditorSettings() {
  const eventSettings = useEditorSettings((state) => state.eventSettings);
  const setShowQuickEntry = useEditorSettings((state) => state.setShowQuickEntry);
  const setStartTimeIsLastEnd = useEditorSettings((state) => state.setStartTimeIsLastEnd);
  const setDefaultPublic = useEditorSettings((state) => state.setDefaultPublic);
  const setShowNif = useEditorSettings((state) => state.setShowNif);

  return (
    <div className={style.sectionContainer}>
      <span className={style.title}>Rundown settings</span>
      <ModalSplitInput field='' title='Show quick entry' description='Whether quick entry shows under selected event'>
        <Switch
          variant='ontime-on-light'
          defaultChecked={eventSettings.showQuickEntry}
          onChange={(event) => setShowQuickEntry(event.target.checked)}
        />
      </ModalSplitInput>
      <ModalSplitInput
        field=''
        title='Start time is last end'
        description='New events start time will be previous event end'
      >
        <Switch
          variant='ontime-on-light'
          defaultChecked={eventSettings.startTimeIsLastEnd}
          onChange={(event) => setStartTimeIsLastEnd(event.target.checked)}
        />
      </ModalSplitInput>
      <ModalSplitInput field='' title='Default public' description='New events will be public'>
        <Switch
          variant='ontime-on-light'
          defaultChecked={eventSettings.defaultPublic}
          onChange={(event) => setDefaultPublic(event.target.checked)}
        />
      </ModalSplitInput>
      <span className={style.title}>Info settings</span>
      <ModalSplitInput
        field=''
        title='Show network'
        description='Whether to available show network interfaces in the panel'
      >
        <Switch
          variant='ontime-on-light'
          defaultChecked={eventSettings.showQuickEntry}
          onChange={(event) => setShowNif(event.target.checked)}
        />
      </ModalSplitInput>
    </div>
  );
}
