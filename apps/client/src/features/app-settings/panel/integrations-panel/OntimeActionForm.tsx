import { AutomationDTO, OntimeAction, OntimeActionKey, SecondarySource } from 'ontime-types';
import { useState } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import Input from '../../../../common/components/input/input/Input';
import Select, { type SelectOption } from '../../../../common/components/select/Select';
import * as Panel from '../../panel-utils/PanelUtils';
import type { OutputErrors } from './automationUtils';
import TemplateInput from './template-input/TemplateInput';

import style from './AutomationForm.module.scss';

const actionOptions: SelectOption<OntimeActionKey>[] = [
  { group: 'Playback', value: 'playback-start', label: 'Start playback' },
  { group: 'Playback', value: 'playback-pause', label: 'Pause playback' },
  { group: 'Playback', value: 'playback-stop', label: 'Stop playback' },
  { group: 'Playback', value: 'playback-roll', label: 'Roll playback' },

  { group: 'Offset', value: 'offset-reset', label: 'Reset offset' },
  { group: 'Offset', value: 'offset-plan', label: 'Undo offset reset' },

  { group: 'Aux timers', value: 'aux1-start', label: 'Start aux 1' },
  { group: 'Aux timers', value: 'aux1-pause', label: 'Pause aux 1' },
  { group: 'Aux timers', value: 'aux1-stop', label: 'Stop aux 1' },
  { group: 'Aux timers', value: 'aux1-set', label: 'Set aux 1' },
  { group: 'Aux timers', value: 'aux2-start', label: 'Start aux 2' },
  { group: 'Aux timers', value: 'aux2-pause', label: 'Pause aux 2' },
  { group: 'Aux timers', value: 'aux2-stop', label: 'Stop aux 2' },
  { group: 'Aux timers', value: 'aux2-set', label: 'Set aux 2' },
  { group: 'Aux timers', value: 'aux3-start', label: 'Start aux 3' },
  { group: 'Aux timers', value: 'aux3-pause', label: 'Pause aux 3' },
  { group: 'Aux timers', value: 'aux3-stop', label: 'Stop aux 3' },
  { group: 'Aux timers', value: 'aux3-set', label: 'Set aux 3' },

  { group: 'Messages', value: 'message-set', label: 'Set timer message' },
  { group: 'Messages', value: 'message-secondary', label: 'Set secondary message' },
];

interface OntimeActionFormProps {
  index: number;
  register: UseFormRegister<AutomationDTO>;
  rowErrors?: OutputErrors;
  value: OntimeAction['action'];
  watch: UseFormWatch<AutomationDTO>;
  setValue: UseFormSetValue<AutomationDTO>;
}

export default function OntimeActionForm({
  index,
  register,
  setValue,
  rowErrors,
  value,
  watch,
}: OntimeActionFormProps) {
  const [selectedAction, setSelectedAction] = useState<string>(value);

  const handleSetAction = (value: OntimeActionKey) => {
    setValue(`outputs.${index}.action`, value, { shouldDirty: true });
    setSelectedAction(value);
  };

  return (
    <>
      <label>
        Action
        <Select
          onValueChange={(value: OntimeActionKey | null) => {
            if (value === null) return;
            handleSetAction(value);
          }}
          value={watch(`outputs.${index}.action`)}
          options={actionOptions}
        />
        <Panel.Error>{rowErrors?.action?.message}</Panel.Error>
      </label>

      {selectedAction.startsWith('aux') && selectedAction.endsWith('set') && (
        <label>
          New time
          <Input
            {...register(`outputs.${index}.time`, {
              required: { value: true, message: 'Required field' },
            })}
            fluid
            placeholder='eg: 10m5s'
          />
          <Panel.Error>{rowErrors?.time?.message}</Panel.Error>
        </label>
      )}

      {selectedAction === 'message-set' && (
        <>
          <label className={style.spanFull}>
            Text (leave empty for no change)
            <TemplateInput
              {...register(`outputs.${index}.text`)}
              value={watch(`outputs.${index}.text`) ?? ''}
              fluid
              placeholder='eg: Timer is finished'
            />
            <Panel.Error>{rowErrors?.text?.message}</Panel.Error>
          </label>
          <label className={style.spanFull}>
            Visibility
            <Select
              onValueChange={(value) => {
                // we need to translate the null to undefined so it becomes 'untouched'
                const translatedValue = value === null ? undefined : value;
                setValue(`outputs.${index}.visible`, translatedValue, { shouldDirty: true });
              }}
              value={watch(`outputs.${index}.visible`)}
              options={[
                { value: null, label: 'Untouched' },
                { value: true, label: 'Show' },
                { value: false, label: 'Hide' },
              ]}
            />
            <Panel.Error>{rowErrors?.visible?.message}</Panel.Error>
          </label>
        </>
      )}

      {selectedAction === 'message-secondary' && (
        <>
          <label>
            Text (leave empty for no change)
            <TemplateInput
              {...register(`outputs.${index}.text`)}
              value={watch(`outputs.${index}.text`) ?? ''}
              fluid
              placeholder='eg: Next up: keynote'
            />
            <Panel.Error>{rowErrors?.text?.message}</Panel.Error>
          </label>
          <label>
            Timer secondary source
            <Select<SecondarySource | 'no-change' | 'null' | null>
              onValueChange={(value) => {
                // null -> no selection
                if (value === null) return;
                // no-change -> leave the current secondary source untouched
                if (value === 'no-change') {
                  setValue(`outputs.${index}.secondarySource`, undefined, { shouldDirty: true });
                  return;
                }
                // 'null' -> clear the secondary source
                if (value === 'null') {
                  setValue(`outputs.${index}.secondarySource`, null, { shouldDirty: true });
                  return;
                }
                setValue(`outputs.${index}.secondarySource`, value, { shouldDirty: true });
              }}
              value={watch(`outputs.${index}.secondarySource`) ?? 'no-change'}
              options={[
                { value: 'no-change', label: 'No change' },
                { value: 'aux1', label: 'Auxiliary timer 1' },
                { value: 'aux2', label: 'Auxiliary timer 2' },
                { value: 'aux3', label: 'Auxiliary timer 3' },
                { value: 'secondary', label: 'Secondary' },
                { value: 'null', label: 'None' }, // allow the user to clear the secondary source
              ]}
            />
            <Panel.Error>{rowErrors?.secondarySource?.message}</Panel.Error>
          </label>
        </>
      )}
    </>
  );
}
