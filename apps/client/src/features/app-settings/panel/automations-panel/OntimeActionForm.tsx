import { PropsWithChildren, useState } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { AutomationDTO, OntimeAction, OntimeActionKey, SecondarySource } from 'ontime-types';

import Input from '../../../../common/components/input/input/Input';
import Select from '../../../../common/components/select/Select';
import * as Panel from '../../panel-utils/PanelUtils';

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

export default function OntimeActionForm(props: PropsWithChildren<OntimeActionFormProps>) {
  const { index, register, setValue, rowErrors, value, children, watch } = props;
  const [selectedAction, setSelectedAction] = useState<string>(value);

  const handleSetAction = (value: OntimeActionKey) => {
    setValue(`outputs.${index}.action`, value, { shouldDirty: true });

    // we dont really need to handle these individually
    if (value === 'aux1-set' || value === 'aux2-set' || value === 'aux3-set') {
      setSelectedAction('aux-set');
    } else {
      setSelectedAction(value);
    }
  };

  return (
    <div className={style.actionSection}>
      <label>
        Action
        <Select
          onValueChange={(value) => {
            handleSetAction(value as OntimeActionKey);
          }}
          value={watch(`outputs.${index}.action`)}
          options={[
            { value: 'aux1-pause', label: 'Aux 1: pause' },
            { value: 'aux2-pause', label: 'Aux 2: pause' },
            { value: 'aux3-pause', label: 'Aux 3: pause' },

            { value: 'aux1-start', label: 'Aux 1: start' },
            { value: 'aux2-start', label: 'Aux 2: start' },
            { value: 'aux3-start', label: 'Aux 3: start' },

            { value: 'aux1-stop', label: 'Aux 1: stop' },
            { value: 'aux2-stop', label: 'Aux 2: stop' },
            { value: 'aux3-stop', label: 'Aux 3: stop' },

            { value: 'aux1-set', label: 'Aux 1: set' },
            { value: 'aux2-set', label: 'Aux 2: set' },
            { value: 'aux3-set', label: 'Aux 3: set' },

            { value: 'message-set', label: 'Primary Message: set' },
            { value: 'message-secondary', label: 'Secondary Message: source' },
          ]}
        />
        <Panel.Error>{rowErrors?.action?.message}</Panel.Error>
      </label>

      {selectedAction === 'aux-set' && (
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
            <Input {...register(`outputs.${index}.text`)} fluid placeholder='eg: Timer is finished' />
            <Panel.Error>{rowErrors?.text?.message}</Panel.Error>
          </label>
          <label>
            Visibility
            <Select
              onValueChange={(value) => {
                // we need to translate the undefined value to 'untouched'
                const translatedValue = value === 'untouched' ? undefined : (value as boolean | undefined);
                setValue(`outputs.${index}.visible`, translatedValue, { shouldDirty: true });
              }}
              value={watch(`outputs.${index}.visible`) === undefined ? 'untouched' : watch(`outputs.${index}.visible`)}
              options={[
                { value: 'untouched', label: 'Untouched' },
                { value: true, label: 'Show' },
                { value: false, label: 'Hide' },
              ]}
            />
            <Panel.Error>{rowErrors?.visible?.message}</Panel.Error>
          </label>
        </>
      )}

      {selectedAction === 'message-secondary' && (
        <label>
          Timer secondary source
          <Select
            onValueChange={(value) => {
              setValue(`outputs.${index}.secondarySource`, value as SecondarySource, { shouldDirty: true });
            }}
            value={watch(`outputs.${index}.secondarySource`)}
            options={[
              { value: null, label: 'Select secondary source', disabled: true },
              { value: 'aux1', label: 'Auxiliary timer 1' },
              { value: 'aux2', label: 'Auxiliary timer 2' },
              { value: 'aux3', label: 'Auxiliary timer 3' },
              { value: 'external', label: 'External' },
              { value: 'null', label: 'None' },
            ]}
          />
          <Panel.Error>{rowErrors?.secondarySource?.message}</Panel.Error>
        </label>
      )}
      <div className={style.test}>{children}</div>
    </div>
  );
}
