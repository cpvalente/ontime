import { PropsWithChildren, useState } from 'react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { AutomationDTO, OntimeAction } from 'ontime-types';

import Input from '../../../../common/components/input/input/Input';
import Select from '../../../../common/components/select/Select';
import { cx } from '../../../../common/utils/styleUtils';
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
  setValue: UseFormSetValue<AutomationDTO>;
}

export default function OntimeActionForm(props: PropsWithChildren<OntimeActionFormProps>) {
  const { index, register, setValue, rowErrors, value, children } = props;
  const [selectedAction, setSelectedAction] = useState<OntimeAction['action']>(value || 'aux1-pause');

  const updateSelectedAction = (value: string) => {
    setSelectedAction(value as OntimeAction['action']);
    setValue(`outputs.${index}.action`, value as OntimeAction['action']);
  };

  return (
    <div className={cx([style.actionSection, selectedAction && style[selectedAction]])}>
      <input type='hidden' {...register(`outputs.${index}.action`)} value={selectedAction} />
      <label>
        Action
        <Select
          onValueChange={(value) => updateSelectedAction(value)}
          value={selectedAction}
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

            { value: 'message-set', label: 'Timer: timer message' },
            { value: 'message-secondary', label: 'Timer: timer secondary' },
          ]}
        />
        <Panel.Error>{rowErrors?.action?.message}</Panel.Error>
      </label>

      {selectedAction === 'aux1-set' && (
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
              {...register(`outputs.${index}.visible`)}
              options={[
                { value: '', label: 'Untouched' },
                { value: 'true', label: 'Show' },
                { value: 'false', label: 'Hide' },
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
            {...register(`outputs.${index}.secondarySource`)}
            options={[
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
