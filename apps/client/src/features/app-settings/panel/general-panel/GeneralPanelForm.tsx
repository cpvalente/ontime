import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, Input, Select } from '@chakra-ui/react';
import { Settings } from 'ontime-types';

import { logAxiosError } from '../../../../common/api/apiUtils';
import { postSettings } from '../../../../common/api/ontimeApi';
import useSettings from '../../../../common/hooks-query/useSettings';
import { isOnlyNumbers } from '../../../../common/utils/regex';

import GeneralPinInput from './GeneralPinInput';
import GeneralSplitInput from './GeneralSplitInput';

import style from './GeneralPanel.module.scss';

export type GeneralPanelFormValues = {
  filename: string;
};

interface GeneralPanelFormProps {
  action: 'duplicate' | 'rename' | 'create';
  submitError: string | null;
}

export default function GeneralPanelForm({ submitError }: GeneralPanelFormProps) {
  const { data, status, refetch } = useSettings();
  const {
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isDirty, isValid, errors },
  } = useForm<Settings>({
    defaultValues: data,
    values: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  const onSubmit = async (formData: Settings) => {
    try {
      await postSettings(formData);
    } catch (error) {
      logAxiosError('Error saving settings', error);
    } finally {
      await refetch();
    }
  };

  const disableInputs = status === 'pending';
  const disableSubmit = isSubmitting || !isDirty || !isValid;

  const onReset = () => {
    reset(data);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className={style.form} id='app-settings'>
        <GeneralSplitInput
          field='serverPort'
          title='Ontime is available on port'
          description='Default 4001 (needs app restart to change)'
          error={errors.serverPort?.message}
        >
          <Input
            id='serverPort'
            size='sm'
            type='number'
            variant='ontime-filled'
            maxLength={5}
            width='75px'
            {...register('serverPort', {
              required: { value: true, message: 'Required field' },
              max: { value: 65535, message: 'Port must be within range 1024 - 65535' },
              min: { value: 1024, message: 'Port must be within range 1024 - 65535' },
              pattern: {
                value: isOnlyNumbers,
                message: 'Value should be numeric',
              },
            })}
          />
        </GeneralSplitInput>
        <GeneralSplitInput
          field='editorKey'
          title='Editor pin code'
          description='Protect the editor with a pin code'
          error={errors.editorKey?.message}
        >
          <GeneralPinInput register={register as any} formName='editorKey' isDisabled={disableInputs} />
        </GeneralSplitInput>
        <GeneralSplitInput
          field='operatorKey'
          title='Operator pin code'
          description='Protect the cuesheet with a pin code'
          error={errors.operatorKey?.message}
        >
          <GeneralPinInput register={register as any} formName='operatorKey' isDisabled={disableInputs} />
        </GeneralSplitInput>
        <GeneralSplitInput
          field='timeFormat'
          title='Time Format'
          description='Views 12 / 24 hours'
          error={errors.timeFormat?.message}
        >
          <Select size='sm' width='auto' isDisabled={disableInputs} {...register('timeFormat')}>
            <option value='12'>12 hours eg. 11:00:10 PM</option>
            <option value='24'>24 hours eg. 23:00:10</option>
          </Select>
        </GeneralSplitInput>
        <GeneralSplitInput
          field='language'
          title='Views Language'
          description='Language for static fields in views'
          error={errors.language?.message}
        >
          <Select size='sm' width='auto' isDisabled={disableInputs} {...register('language')}>
            <option value='en'>English</option>
            <option value='fr'>French</option>
            <option value='de'>German</option>
            <option value='it'>Italian</option>
            <option value='no'>Norwegian</option>
            <option value='pt'>Portuguese</option>
            <option value='es'>Spanish</option>
            <option value='sv'>Swedish</option>
          </Select>
        </GeneralSplitInput>
        <Box className={style.footer}>
          <Button isDisabled={!isDirty} variant='ontime-ghost' size='sm' onClick={onReset}>
            Revert to saved
          </Button>
          <Button
            type='submit'
            form='app-settings'
            isLoading={isSubmitting}
            isDisabled={disableSubmit}
            variant='ontime-filled'
            padding='0 2em'
            size='sm'
          >
            Save
          </Button>
        </Box>
      </form>
      {submitError && <span className={style.error}>{submitError}</span>}
    </>
  );
}
