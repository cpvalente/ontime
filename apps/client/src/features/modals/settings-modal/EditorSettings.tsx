import { HStack, Input, Stack, Switch } from '@chakra-ui/react';

import { useEditorSettings } from '../../../common/stores/editorSettings';
import ModalSplitInput from '../ModalSplitInput';

import style from './SettingsModal.module.scss';

export default function EditorSettings() {
  const eventSettings = useEditorSettings((state) => state.eventSettings);
  const setShowQuickEntry = useEditorSettings((state) => state.setShowQuickEntry);
  const setAddtimeamounts = useEditorSettings((state) => state.setAddtimeamounts);
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
      <span className={style.title}>Playback settings</span>
      <ModalSplitInput
        field=''
        title='Addtime amounts'
        description='Set the amount of time the add/remove buttons take'
      >
        <HStack>
          <Stack>
            <label>Normal values</label>
            <Input
              size='sm'
              variant='ontime-on-light'
              type='number'
              defaultValue={eventSettings.addTimeAmounts.a}
              onChange={(event) =>
                setAddtimeamounts({ ...eventSettings.addTimeAmounts, a: Number(event.target.value) })
              }
            />
            <Input
              size='sm'
              variant='ontime-on-light'
              type='number'
              defaultValue={eventSettings.addTimeAmounts.a}
              onChange={(event) =>
                setAddtimeamounts({ ...eventSettings.addTimeAmounts, b: Number(event.target.value) })
              }
            />
            <Input
              size='sm'
              variant='ontime-on-light'
              type='number'
              defaultValue={eventSettings.addTimeAmounts.a}
              onChange={(event) =>
                setAddtimeamounts({ ...eventSettings.addTimeAmounts, c: Number(event.target.value) })
              }
            />
            <Input
              size='sm'
              variant='ontime-on-light'
              type='number'
              defaultValue={eventSettings.addTimeAmounts.a}
              onChange={(event) =>
                setAddtimeamounts({ ...eventSettings.addTimeAmounts, d: Number(event.target.value) })
              }
            />
          </Stack>
          <Stack>
            <label>Shift values</label>
            <Input
              size='sm'
              variant='ontime-on-light'
              type='number'
              defaultValue={eventSettings.addTimeAmounts.aShift}
              onChange={(event) =>
                setAddtimeamounts({ ...eventSettings.addTimeAmounts, aShift: Number(event.target.value) })
              }
            />
            <Input
              size='sm'
              variant='ontime-on-light'
              type='number'
              defaultValue={eventSettings.addTimeAmounts.bShift}
              onChange={(event) =>
                setAddtimeamounts({ ...eventSettings.addTimeAmounts, bShift: Number(event.target.value) })
              }
            />
            <Input
              size='sm'
              variant='ontime-on-light'
              type='number'
              defaultValue={eventSettings.addTimeAmounts.cShift}
              onChange={(event) =>
                setAddtimeamounts({ ...eventSettings.addTimeAmounts, cShift: Number(event.target.value) })
              }
            />
            <Input
              size='sm'
              variant='ontime-on-light'
              type='number'
              defaultValue={eventSettings.addTimeAmounts.dShift}
              onChange={(event) =>
                setAddtimeamounts({ ...eventSettings.addTimeAmounts, dShift: Number(event.target.value) })
              }
            />
          </Stack>
        </HStack>
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
