import { useDisclosure } from '@mantine/hooks';
import { ViewSettings as ViewSettingsType } from 'ontime-types';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { maybeAxiosError } from '../../../../common/api/utils';
import Button from '../../../../common/components/buttons/Button';
import Info from '../../../../common/components/info/Info';
import ExternalLink from '../../../../common/components/link/external-link/ExternalLink';
import Switch from '../../../../common/components/switch/Switch';
import Tag from '../../../../common/components/tag/Tag';
import useViewSettings, { useUpdateViewSettings } from '../../../../common/hooks-query/useViewSettings';
import { preventEscape } from '../../../../common/utils/keyEvent';
import * as Panel from '../../panel-utils/PanelUtils';
import CodeEditorModal from './composite/StyleEditorModal';

const cssOverrideDocsUrl = 'https://docs.getontime.no/features/custom-styling/';

export default function ViewSettings() {
  const { data, status } = useViewSettings();
  const { updateViewSettings } = useUpdateViewSettings();
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
      await updateViewSettings(formData);
    } catch (error) {
      const message = maybeAxiosError(error);
      setError('root', { message });
    }
  };

  const onReset = () => {
    reset(data);
  };

  const overrideStylesEnabled = watch('overrideStyles');

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
          <Panel.Loader isLoading={status === 'pending'} />
          <Panel.Error>{errors.root?.message}</Panel.Error>
          <Panel.ListGroup>
            <CodeEditorModal isOpen={isCodeEditorOpen} onClose={codeEditorHandler.close} />
            <Panel.ListItem>
              <Panel.Field
                title={
                  <>
                    <span>Override CSS styles</span>
                    {overrideStylesEnabled && <Tag variant='warning'>ON</Tag>}
                  </>
                }
                description={
                  overrideStylesEnabled
                    ? 'CSS override is ON. Ontime views will use the custom override stylesheet.'
                    : 'Enables overriding view styles with custom stylesheet'
                }
                descriptionTone={overrideStylesEnabled ? 'warning' : 'default'}
              />
              <Switch
                size='large'
                checked={overrideStylesEnabled}
                onCheckedChange={(value: boolean) => setValue('overrideStyles', value, { shouldDirty: true })}
              />
              <Button onClick={codeEditorHandler.open} disabled={status !== 'success' || isSubmitting}>
                Edit CSS override
              </Button>
            </Panel.ListItem>
          </Panel.ListGroup>
        </Panel.Section>
      </Panel.Card>
    </Panel.Section>
  );
}
