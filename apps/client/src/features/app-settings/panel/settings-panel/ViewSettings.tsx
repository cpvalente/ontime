import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDisclosure } from '@mantine/hooks';
import { ViewSettings as ViewSettingsType } from 'ontime-types';

import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import { SwatchPickerRHF } from '../../../../common/components/input/colour-input/SwatchPicker';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import Switch from '../../../../common/components/switch/Switch';
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
    reset,
    setValue,
    watch,
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
              <Switch
                size='large'
                checked={watch('overrideStyles')}
                onCheckedChange={(value: boolean) => setValue('overrideStyles', value, { shouldDirty: true })}
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
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
