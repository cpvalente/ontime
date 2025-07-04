import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Switch } from '@chakra-ui/react';
import { useDisclosure } from '@mantine/hooks';
import { ViewSettings as ViewSettingsType } from 'ontime-types';

import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import { SwatchPickerRHF } from '../../../../common/components/input/colour-input/SwatchPicker';
import Input from '../../../../common/components/input/input/Input';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import useViewSettings from '../../../../common/hooks-query/useViewSettings';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';

import CodeEditorModal from './composite/StyleEditorModal';

const cssOverrideDocsUrl = 'https://docs.getontime.no/features/custom-styling/';

export default function ViewSettings() {
  const { data, isPending, mutateAsync } = useViewSettings();
  const [isCodeEditorOpen, codeEditorHandler] = useDisclosure();

  const {
    control,
    handleSubmit,
    setError,
    register,
    reset,
    formState: { isSubmitting, isDirty, errors },
  } = useForm<ViewSettingsType>({
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

  const onSubmit = async (formData: ViewSettingsType) => {
    try {
      mutateAsync(formData);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    }
  };

  const onReset = () => {
    reset(data);
  };

  if (!control) {
    return null;
  }

  return (
    <Panel.Section
      as='form'
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(event) => preventEscape(event, onReset)}
      id='view-settings'
    >
      <Panel.Card>
        <Panel.SubHeader>
          View settings
          <Panel.InlineElements>
            <Button disabled={!isDirty} variant='ghosted' onClick={onReset}>
              Revert to saved
            </Button>
            <Button type='submit' loading={isSubmitting} disabled={!isDirty} variant='primary'>
              Save
            </Button>
          </Panel.InlineElements>
        </Panel.SubHeader>
        <Panel.Divider />
        <Info>
          You can customise the styles applied to Ontime views by providing overriding CSS rules.
          <br />
          <ExternalLink href={cssOverrideDocsUrl}>See the docs</ExternalLink>
        </Info>
        <Panel.Section>
          <Panel.Loader isLoading={isPending} />
          <Panel.Error>{errors.root?.message}</Panel.Error>
          <Panel.ListGroup>
            <CodeEditorModal isOpen={isCodeEditorOpen} onClose={codeEditorHandler.close} />
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
              <Button onClick={codeEditorHandler.open} disabled={isSubmitting}>
                Edit CSS override
              </Button>
            </Panel.ListItem>
          </Panel.ListGroup>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field title='Timer colour' description='Default colour of a running timer' />
              <SwatchPickerRHF name='normalColor' control={control} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Warning colour' description='Colour of a running timer in warning mode' />
              <SwatchPickerRHF name='warningColor' control={control} />
            </Panel.ListItem>
            <Panel.ListItem>
              <Panel.Field title='Danger colour' description='Colour of a running timer in danger mode' />
              <SwatchPickerRHF name='dangerColor' control={control} />
            </Panel.ListItem>
          </Panel.ListGroup>
          <Panel.ListGroup>
            <Panel.ListItem>
              <Panel.Field
                title='Freeze timer on end'
                description='When a timer hits 00:00:00, it freezes instead of going negative. It invalidates the End Message.'
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
                description='Message for negative timers; applies only if the timer isn`t frozen on End. If no message is provided, it continues into negative time'
              />
              <Input
                maxLength={150}
                style={{ width: '275px' }}
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
