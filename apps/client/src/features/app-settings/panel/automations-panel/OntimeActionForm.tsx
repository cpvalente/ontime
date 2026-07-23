import { AutomationDTO, OntimeAction, OntimeActionKey, SecondarySource } from 'ontime-types';
import { PropsWithChildren, useState } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import Input from '../../../../common/components/input/input/Input';
import Select from '../../../../common/components/select/Select';
import useSettings from '../../../../common/hooks-query/useSettings';
import { getAuxTimerLabel } from '../../../../common/utils/auxTimerUtils';
import * as Panel from '../../panel-utils/PanelUtils';
import TemplateInput from './template-input/TemplateInput';

import style from './AutomationForm.module.scss';

interface OntimeActionFormProps {
  index: number;
  register: UseFormRegister<AutomationDTO>;
  rowErrors?: {
    action?: { message?: string };
    time?: { message?: string };
    text?: { message?: string };
    visible?: { message?: string };
    secondarySource?: { message?: string };
  };
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
  children,
  watch,
}: PropsWithChildren<OntimeActionFormProps>) {
  const [selectedAction, setSelectedAction] = useState<string>(value);
  const { data: settings } = useSettings();

  const handleSetAction = (value: OntimeActionKey) => {
    setValue(`outputs.${index}.action`, value, { shouldDirty: true });
    setSelectedAction(value);
  };

  const auxLabel = (auxIndex: number) => getAuxTimerLabel(settings.auxTimerNames, auxIndex, `Aux ${auxIndex}`);

  return (
    <div className={style.actionSection}>
      <label>
        Action
        <Select
          onValueChange={(value: OntimeActionKey | null) => {
            if (value === null) return;
            handleSetAction(value);
          }}
          value={watch(`outputs.${index}.action`)}
          options={[
            { value: 'aux1-pause', label: `${auxLabel(1)}: pause` },
            { value: 'aux2-pause', label: `${auxLabel(2)}: pause` },
            { value: 'aux3-pause', label: `${auxLabel(3)}: pause` },

            { value: 'aux1-start', label: `${auxLabel(1)}: start` },
            { value: 'aux2-start', label: `${auxLabel(2)}: start` },
            { value: 'aux3-start', label: `${auxLabel(3)}: start` },

            { value: 'aux1-stop', label: `${auxLabel(1)}: stop` },
            { value: 'aux2-stop', label: `${auxLabel(2)}: stop` },
            { value: 'aux3-stop', label: `${auxLabel(3)}: stop` },

            { value: 'aux1-set', label: `${auxLabel(1)}: set` },
            { value: 'aux2-set', label: `${auxLabel(2)}: set` },
            { value: 'aux3-set', label: `${auxLabel(3)}: set` },

            { value: 'playback-start', label: 'Playback: start' },
            { value: 'playback-stop', label: 'Playback: stop' },
            { value: 'playback-pause', label: 'Playback: pause' },
            { value: 'playback-roll', label: 'Playback: roll' },

            { value: 'message-set', label: 'Primary Message' },
            { value: 'message-secondary', label: 'Secondary Message' },
          ]}
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
          <label>
            Text (leave empty for no change)
            <TemplateInput
              {...register(`outputs.${index}.text`)}
              value={watch(`outputs.${index}.text`) ?? ''}
              fluid
              placeholder='eg: Timer is finished'
            />
            <Panel.Error>{rowErrors?.text?.message}</Panel.Error>
          </label>
          <label>
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

      <div className={style.test}>{children}</div>
    </div>
  );
}
