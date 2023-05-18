import { Switch } from '@chakra-ui/react';

import { useLocalEvent } from '../../../common/stores/localEvent';
import ModalSplitInput from '../ModalSplitInput';

import style from './SettingsModal.module.scss';

export default function EditorSettings() {
  const eventSettings = useLocalEvent((state) => state.eventSettings);
  const setShowQuickEntry = useLocalEvent((state) => state.setShowQuickEntry);
  const setStartTimeIsLastEnd = useLocalEvent((state) => state.setStartTimeIsLastEnd);
  const setDefaultPublic = useLocalEvent((state) => state.setDefaultPublic);

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
    </div>
  );
}
