import { PropsWithChildren, useState } from 'react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Input, Select } from '@chakra-ui/react';
import { AutomationDTO, OntimeAction } from 'ontime-types';

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
  const [selectedAction, setSelectedAction] = useState<OntimeAction['action']>(value || 'aux-start');

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
          variant='ontime'
          size='sm'
          value={selectedAction}
          onChange={(event) => updateSelectedAction(event.target.value)}
        >
          <option value='aux-start'>Auxiliary timer: start</option>
          <option value='aux-pause'>Auxiliary timer: pause</option>
          <option value='aux-stop'>Auxiliary timer: stop</option>
          <option value='aux-set'>Auxiliary timer: set</option>
          <option value='message-set'>Timer: timer message</option>
          <option value='message-secondary'>Timer: timer secondary</option>
        </Select>
        <Panel.Error>{rowErrors?.action?.message}</Panel.Error>
      </label>

      {selectedAction === 'aux-set' && (
        <label>
          New time
          <Input
            {...register(`outputs.${index}.time`, {
              required: { value: true, message: 'Required field' },
            })}
            variant='ontime-filled'
            size='sm'
            placeholder='eg: 10m5s'
            autoComplete='off'
          />
          <Panel.Error>{rowErrors?.time?.message}</Panel.Error>
        </label>
      )}

      {selectedAction === 'message-set' && (
        <>
          <label>
            Text (leave empty for no change)
            <Input
              {...register(`outputs.${index}.text`)}
              variant='ontime-filled'
              size='sm'
              placeholder='eg: Timer is finished'
              autoComplete='off'
            />
            <Panel.Error>{rowErrors?.text?.message}</Panel.Error>
          </label>
          <label>
            Visibility
            <Select variant='ontime' size='sm' {...register(`outputs.${index}.visible`)}>
              <option value=''>Untouched</option>
              <option value='true'>Show</option>
              <option value='false'>Hide</option>
            </Select>
            <Panel.Error>{rowErrors?.visible?.message}</Panel.Error>
          </label>
        </>
      )}

      {selectedAction === 'message-secondary' && (
        <label>
          Timer secondary source
          <Select variant='ontime' size='sm' {...register(`outputs.${index}.secondarySource`)}>
            <option value='aux'>Auxiliary timer</option>
            <option value='external'>External</option>
            <option value='null'>None</option>
          </Select>
          <Panel.Error>{rowErrors?.secondarySource?.message}</Panel.Error>
        </label>
      )}
      <div className={style.test}>{children}</div>
    </div>
  );
}
