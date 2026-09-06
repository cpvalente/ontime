import type { AutomationDTO, OSCOutput } from 'ontime-types';
import type { UseFormRegister } from 'react-hook-form';

import Input from '../../../../common/components/input/input/Input';
import * as Panel from '../../panel-utils/PanelUtils';
import type { OutputErrors } from './automationUtils';
import TemplateInput from './template-input/TemplateInput';

import style from './AutomationForm.module.scss';

interface OscOutputFormProps {
  index: number;
  output: OSCOutput;
  register: UseFormRegister<AutomationDTO>;
  rowErrors?: OutputErrors;
}

export default function OscOutputForm({ index, output, register, rowErrors }: OscOutputFormProps) {
  return (
    <>
      <label>
        Target IP
        <Input
          {...register(`outputs.${index}.targetIP`, { required: { value: true, message: 'Required field' } })}
          fluid
          placeholder='127.0.0.1'
        />
        <Panel.Error>{rowErrors?.targetIP?.message}</Panel.Error>
      </label>
      <label>
        Target Port
        <Input
          {...register(`outputs.${index}.targetPort`, {
            required: { value: true, message: 'Required field' },
            setValueAs: (value) => (value === '' ? 0 : Number(value)),
            max: { value: 65535, message: 'Port must be within range 1024 - 65535' },
            min: { value: 1024, message: 'Port must be within range 1024 - 65535' },
          })}
          fluid
          type='number'
          maxLength={5}
          placeholder='8000'
        />
        <Panel.Error>{rowErrors?.targetPort?.message}</Panel.Error>
      </label>
      <label className={style.spanFull}>
        Address
        <TemplateInput
          {...register(`outputs.${index}.address`)}
          value={output.address}
          fluid
          placeholder='/cue/start'
        />
        <Panel.Error>{rowErrors?.address?.message}</Panel.Error>
      </label>
      <label className={style.spanFull}>
        Arguments
        <TemplateInput {...register(`outputs.${index}.args`)} value={output.args} fluid placeholder='1' />
        <Panel.Error>{rowErrors?.args?.message}</Panel.Error>
      </label>
    </>
  );
}
