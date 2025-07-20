import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { OntimeView, URLPreset } from 'ontime-types';

import { maybeAxiosError, unwrapError } from '../../../../../common/api/utils';
import Button from '../../../../../common/components/buttons/Button';
import Input from '../../../../../common/components/input/input/Input';
import Select, { SelectOption } from '../../../../../common/components/select/Select';
import { useUpdateUrlPreset } from '../../../../../common/hooks-query/useUrlPresets';
import { preventEscape } from '../../../../../common/utils/keyEvent';
import { generateUrlPresetOptions } from '../../../../../common/utils/urlPresets';
import * as Panel from '../../../panel-utils/PanelUtils';

import style from './URLPresetForm.module.scss';

const targetOptions: SelectOption[] = [
  { value: OntimeView.Cuesheet, label: 'Cuesheet' },
  { value: OntimeView.Operator, label: 'Operator' },
  { value: OntimeView.Timer, label: 'Timer' },
  { value: OntimeView.Backstage, label: 'Backstage' },
  { value: OntimeView.Timeline, label: 'Timeline' },
  { value: OntimeView.StudioClock, label: 'Studio Clock' },
  { value: OntimeView.Countdown, label: 'Countdown' },
  { value: OntimeView.ProjectInfo, label: 'Project Info' },
];

const defaultValues: URLPreset = {
  alias: '',
  target: OntimeView.Timer,
  search: '',
  enabled: true,
};

interface URLPresetFormProps {
  urlPreset?: URLPreset;
  onClose: () => void;
}

export default function URLPresetForm({ urlPreset, onClose }: URLPresetFormProps) {
  const { addPreset, updatePreset, isMutating } = useUpdateUrlPreset();

  const {
    handleSubmit,
    register,
    setFocus,
    setError,
    clearErrors,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<URLPreset>({
    defaultValues: urlPreset ?? defaultValues,
    resetOptions: {
      keepDirtyValues: true,
    },
  });
  const urlRef = useRef<HTMLInputElement>(null);

  const setupSubmit = async (data: URLPreset) => {
    try {
      if (urlPreset) {
        await updatePreset(urlPreset.alias, data);
      } else {
        await addPreset(data);
      }
      onClose();
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
    }
  };

  useEffect(() => {
    setFocus('alias');
  }, [setFocus]);

  const generateOptions = () => {
    clearErrors();

    try {
      const preset = generateUrlPresetOptions(getValues('alias'), urlRef.current?.value.trim() ?? '');
      setValue('target', preset.target, { shouldDirty: true, shouldValidate: true });
      setValue('search', preset.search, { shouldDirty: true, shouldValidate: true });
    } catch (error) {
      setError('root', { message: unwrapError(error) });
      return;
    }
  };

  const validateParams = (value: string) => {
    try {
      new URLSearchParams(value);
      return true;
    } catch (error) {
      return unwrapError(error) || 'Invalid URL parameters';
    }
  };

  return (
    <Panel.Indent
      as='form'
      onSubmit={handleSubmit(setupSubmit)}
      onKeyDown={(event) => preventEscape(event, onClose)}
      className={style.column}
    >
      <input hidden name='enabled' value='true' />

      <div>1. Enter URL and let Ontime generate the preset options</div>
      <Panel.InlineElements>
        <div>
          <Panel.Description>Alias</Panel.Description>
          <Input {...register('alias', { required: 'Alias is required' })} />
        </div>
        <div className={style.expand}>
          <Panel.Description>Generate options (paste URL to generate options)</Panel.Description>
          <Panel.InlineElements>
            <Input placeholder='Paste URL' fluid ref={urlRef} required />
            <Button onClick={generateOptions}>Generate</Button>
          </Panel.InlineElements>
        </div>
      </Panel.InlineElements>
      <div> - or -</div>
      <div>2. Choose a view and its parameters</div>
      <div>
        <Panel.Description>Target</Panel.Description>
        <Select
          options={targetOptions}
          {...register('target', { required: 'Target is required' })}
          value={watch('target') as OntimeView}
          onValueChange={(value) => setValue('target', value)}
        />
      </div>
      <div>
        <Panel.Description>Parameters</Panel.Description>
        <Input
          fluid
          {...register('search', {
            validate: validateParams,
          })}
        />
        <Panel.Error>{errors.search?.message}</Panel.Error>
      </div>
      <div>
        <Panel.Error>{errors.root?.message}</Panel.Error>
        <Panel.InlineElements align='end'>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant='primary' type='submit' disabled={!isValid || !isDirty} loading={isSubmitting || isMutating}>
            Save
          </Button>
        </Panel.InlineElements>
      </div>
    </Panel.Indent>
  );
}
