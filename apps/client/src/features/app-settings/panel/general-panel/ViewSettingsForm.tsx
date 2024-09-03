import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertIcon, Button, Input, Switch } from '@chakra-ui/react';
import { ViewSettings } from 'ontime-types';

import { maybeAxiosError } from '../../../../common/api/utils';
import { postViewSettings } from '../../../../common/api/viewSettings';
import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import { PopoverPickerRHF } from '../../../../common/components/input/popover-picker/PopoverPicker';
import useInfo from '../../../../common/hooks-query/useInfo';
import useViewSettings from '../../../../common/hooks-query/useViewSettings';
import * as Panel from '../PanelUtils';

import style from './GeneralPanel.module.scss';

const cssOverrideDocsUrl = 'https://docs.getontime.no/features/custom-styling/';

export default function ViewSettingsForm() {
  const { data, status, refetch } = useViewSettings();
  const { data: info, status: infoStatus } = useInfo();

  const {
    control,
    handleSubmit,
    register,
    reset,
    setError,
    formState: { isSubmitting, isDirty },
  } = useForm<ViewSettings>({
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

  const onSubmit = async (formData: ViewSettings) => {
    const newData = {
      ...formData,
    };

    try {
      await postViewSettings(newData);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    } finally {
      await refetch();
    }
  };

  const onReset = () => {
    reset(data);
  };

  if (!control) {
    return null;
  }

  const isLoading = status === 'pending' || infoStatus === 'pending';

  return (
    <Panel.Section as='form' onSubmit={handleSubmit(onSubmit)} id='view-settings'>
      <Panel.Card>
        <Panel.SubHeader>
          View settings
          <div className={style.actionButtons}>
            <Button isDisabled={!isDirty} variant='ontime-ghosted' size='sm' onClick={onReset}>
              Revert to saved
            </Button>
            <Button type='submit' isLoading={isSubmitting} isDisabled={!isDirty} variant='ontime-filled' size='sm'>
              Save
            </Button>
          </div>
        </Panel.SubHeader>
        <Panel.Divider />
        <Alert status='info' variant='ontime-on-dark-info'>
          <AlertIcon />
          <AlertDescription>
            You can override the styles of the viewers with a custom CSS file. <br />
            {info?.cssOverride && `In your installation the file is at ${info?.cssOverride}`}
            <br />
            <br />
            <ExternalLink href={cssOverrideDocsUrl}>See the docs</ExternalLink>
          </AlertDescription>
        </Alert>
        <Panel.Section>
          <Panel.Loader isLoading={isLoading} />
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field
                title='Override CSS styles'
                description='Enables overriding view styles with custom stylesheet'
              />
              <Controller
                control={control}
                name='overrideStyles'
                render={({ field: { onChange, value, ref } }) => (
                  <Switch variant='ontime' size='lg' isChecked={value} onChange={onChange} ref={ref} />
                )}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='Timer colour' description='Default colour of a running timer' />
              <PopoverPickerRHF name='normalColor' control={control} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Warning colour' description='Colour of a running timer in warning mode' />
              <PopoverPickerRHF name='warningColor' control={control} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Danger colour' description='Colour of a running timer in danger mode' />
              <PopoverPickerRHF name='dangerColor' control={control} />
            </Panel.ListItem>
          </Panel.ListGroup>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field
                title='Freeze timer on end'
                description='Timer in views will stop from going negative and instead stop at 00:00:00'
              />
              <Controller
                control={control}
                name='freezeEnd'
                render={({ field: { onChange, value, ref } }) => (
                  <Switch variant='ontime' size='lg' isChecked={value} onChange={onChange} ref={ref} />
                )}
              />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field
                title='End message'
                description='Message to show on negative timers if not frozen. If not provided, timer will continue'
              />
              <Input
                size='sm'
                autoComplete='off'
                variant='ontime-filled'
                maxLength={150}
                width='275px'
                placeholder='Shown when timer reaches end'
                {...register('endMessage')}
              />
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
