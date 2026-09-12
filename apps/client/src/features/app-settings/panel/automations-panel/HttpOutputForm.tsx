import type { AutomationDTO, HTTPOutput } from 'ontime-types';
import type { UseFormRegister } from 'react-hook-form';

import { startsWithHttp } from '../../../../common/utils/regex';
import * as Panel from '../../panel-utils/PanelUtils';
import type { OutputErrors } from './automationUtils';
import TemplateInput from './template-input/TemplateInput';

import style from './AutomationForm.module.scss';

interface HttpOutputFormProps {
  index: number;
  output: HTTPOutput;
  register: UseFormRegister<AutomationDTO>;
  rowErrors?: OutputErrors;
}

export default function HttpOutputForm({ index, output, register, rowErrors }: HttpOutputFormProps) {
  return (
    <label className={style.spanFull}>
      Target URL
      <TemplateInput
        {...register(`outputs.${index}.url`, {
          required: { value: true, message: 'Required field' },
          pattern: { value: startsWithHttp, message: 'HTTP messages should target http:// or https://' },
        })}
        value={output.url}
        fluid
        placeholder='http://127.0.0.1/start/1'
      />
      <Panel.Error>{rowErrors?.url?.message}</Panel.Error>
    </label>
  );
}
