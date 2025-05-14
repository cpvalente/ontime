import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Select } from '@chakra-ui/react';
import { Settings } from 'ontime-types';

import { postSettings } from '../../../../common/api/settings';
import { maybeAxiosError } from '../../../../common/api/utils';
import useSettings from '../../../../common/hooks-query/useSettings';
import { preventEscape } from '../../../../common/utils/keyEvent';
import { isOnlyNumbers } from '../../../../common/utils/regex';
import { isOntimeCloud } from '../../../../externals';
import * as Panel from '../../panel-utils/PanelUtils';

import GeneralPinInput from './GeneralPinInput';

export default function GeneralPanelForm() {
  const { data, status, refetch } = useSettings();
  const {
    handleSubmit,
    register,
    reset,
    setError,
    formState: { isSubmitting, isDirty, isValid, errors },
  } = useForm<Settings>({
    mode: 'onChange',
    defaultValues: data,
    values: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  // update form if we get new data from server
  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  const onSubmit = async (formData: Settings) => {
    try {
      await postSettings(formData);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    } finally {
      await refetch();
    }
  };

  const disableInputs = status === 'pending';
  const disableSubmit = isSubmitting || !isDirty || !isValid;
  const submitError = '';

  const onReset = () => {
    reset(data);
  };

  const isLoading = status === 'pending';

  return (
    <Panel.Section
      as='form'
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(event) => preventEscape(event, onReset)}
      id='app-settings'
    >
      <Panel.Card>
        <Panel.SubHeader>
          General settings
          <Panel.InlineElements>
            <Button isDisabled={!isDirty || isSubmitting} variant='ontime-ghosted' size='sm' onClick={onReset}>
              Revert to saved
            </Button>
            <Button
              type='submit'
              form='app-settings'
              isLoading={isSubmitting}
              isDisabled={disableSubmit}
              variant='ontime-filled'
              size='sm'
            >
              Save
            </Button>
          </Panel.InlineElements>
        </Panel.SubHeader>
        {submitError && <Panel.Error>{submitError}</Panel.Error>}
        <Panel.Divider />
        <Panel.Section>
          <Panel.Loader isLoading={isLoading} />
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field
                title='Ontime server port'
                description={
                  isOntimeCloud
                    ? 'Server port disabled for Ontime Cloud'
                    : 'Port ontime server listens in. Defaults to 4001 (needs app restart)'
                }
                error={errors.serverPort?.message}
              />
              <Input
                id='serverPort'
                size='sm'
                type='number'
                variant='ontime-filled'
                maxLength={5}
                width='75px'
                isDisabled={isOntimeCloud}
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
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Editor pin code'
                description='Protect the editor view with a pin code'
                error={errors.editorKey?.message}
              />
              <GeneralPinInput register={register} formName='editorKey' isDisabled={disableInputs} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Operator pin code'
                description='Protect the operator and cuesheet views with a pin code'
                error={errors.operatorKey?.message}
              />
              <GeneralPinInput register={register} formName='operatorKey' isDisabled={disableInputs} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Time format'
                description='Default time format to show in views 12 /24 hours'
                error={errors.timeFormat?.message}
              />
              <Select variant='ontime' size='sm' width='auto' isDisabled={disableInputs} {...register('timeFormat')}>
                <option value='12'>12 hours 11:00:10 PM</option>
                <option value='24'>24 hours 23:00:10</option>
              </Select>
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='Views language'
                description='Language to be displayed in views'
                error={errors.language?.message}
              />
              <Select variant='ontime' size='sm' width='auto' isDisabled={disableInputs} {...register('language')}>
                <option value='en'>English</option>
                <option value='fr'>French</option>
                <option value='de'>German</option>
                <option value='hu'>Hungarian</option>
                <option value='it'>Italian</option>
                <option value='no'>Norwegian</option>
                <option value='pt'>Portuguese</option>
                <option value='es'>Spanish</option>
                <option value='sv'>Swedish</option>
                <option value='pl'>Polish</option>
                <option value='zh'>Chinese (Simplified)</option>
              </Select>
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
