import { useForm } from 'react-hook-form';

import { maybeAxiosError } from '../../../../../common/api/utils';
import Button from '../../../../../common/components/buttons/Button';
import Input from '../../../../../common/components/input/input/Input';
import Modal from '../../../../../common/components/modal/Modal';
import { langEn, TranslationObject } from '../../../../../translation/languages/en';
import { useTranslation } from '../../../../../translation/TranslationProvider';
import * as Panel from '../../../panel-utils/PanelUtils';

interface CustomTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomTranslationModal({ isOpen, onClose }: CustomTranslationModalProps) {
  const { userTranslation, postUserTranslation, refetchTranslation: refetch } = useTranslation();

  const translation = transformTranslationObject(userTranslation, '.', '_');

  const {
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isDirty, errors },
    setError,
  } = useForm({
    defaultValues: translation,
    resetOptions: {
      keepDirtyValues: true,
    },
    mode: 'onChange',
  });

  const onSubmit = async (formData: Record<string, string>) => {
    try {
      if (isDirty) {
        const translationData = transformTranslationObject(formData, '_', '.') as TranslationObject;
        await postUserTranslation(translationData);
        reset(formData);
      }
    } catch (error) {
      setError('root', { message: maybeAxiosError(error) });
      /** no error handling for now */
    } finally {
      await refetch();
    }
  };

  return (
    <Modal
      title='Add Translations'
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      showBackdrop
      bodyElements={
        <Panel.Section as='form' onSubmit={handleSubmit(onSubmit)} id='custom-translations-form'>
          <Panel.Card>
            <Panel.SubHeader>Common</Panel.SubHeader>
            <Panel.ListGroup>
              <Panel.ListItem>
                <Panel.Field title='Expected Finish' description='' />
                <Input
                  maxLength={150}
                  {...register('common_expected_finish', {
                    required: 'This field is required',
                  })}
                  placeholder={langEn['common.expected_finish']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Minutes' description='' />
                <Input
                  maxLength={150}
                  {...register('common_minutes', { required: 'This field is required' })}
                  placeholder={langEn['common.minutes']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Now' description='' />
                <Input
                  maxLength={150}
                  {...register('common_now', { required: 'This field is required' })}
                  placeholder={langEn['common.now']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Next' description='' />
                <Input
                  maxLength={150}
                  {...register('common_next', { required: 'This field is required' })}
                  placeholder={langEn['common.next']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Scheduled Start' description='' />
                <Input
                  maxLength={150}
                  {...register('common_scheduled_start', { required: 'This field is required' })}
                  placeholder={langEn['common.scheduled_start']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Scheduled End' description='' />
                <Input
                  maxLength={150}
                  {...register('common_scheduled_end', { required: 'This field is required' })}
                  placeholder={langEn['common.scheduled_end']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Projected Start' description='' />
                <Input
                  maxLength={150}
                  {...register('common_projected_start', { required: 'This field is required' })}
                  placeholder={langEn['common.projected_start']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Projected End' description='' />
                <Input
                  maxLength={150}
                  {...register('common_projected_end', { required: 'This field is required' })}
                  placeholder={langEn['common.projected_end']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Stage Timer' description='' />
                <Input
                  maxLength={150}
                  {...register('common_stage_timer', { required: 'This field is required' })}
                  placeholder={langEn['common.stage_timer']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Started At' description='' />
                <Input
                  maxLength={150}
                  {...register('common_started_at', { required: 'This field is required' })}
                  placeholder={langEn['common.started_at']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Time Now' description='' />
                <Input
                  maxLength={150}
                  {...register('common_time_now', { required: 'This field is required' })}
                  placeholder={langEn['common.time_now']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='No data' description='' />
                <Input
                  maxLength={150}
                  {...register('common_no_data', { required: 'This field is required' })}
                  placeholder={langEn['common.no_data']}
                />
              </Panel.ListItem>
            </Panel.ListGroup>
          </Panel.Card>
          <Panel.Card>
            <Panel.SubHeader>Countdown</Panel.SubHeader>
            <Panel.ListGroup>
              <Panel.ListItem>
                <Panel.Field title='Ended' description='' />
                <Input
                  maxLength={150}
                  {...register('countdown_ended', { required: 'This field is required' })}
                  placeholder={langEn['countdown.ended']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Running' description='' />
                <Input
                  maxLength={150}
                  {...register('countdown_running', { required: 'This field is required' })}
                  placeholder={langEn['countdown.running']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Select Event' description='' />
                <Input
                  maxLength={150}
                  {...register('countdown_select_event', { required: 'This field is required' })}
                  placeholder={langEn['countdown.select_event']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='To start' description='' />
                <Input
                  maxLength={150}
                  {...register('countdown_to_start', { required: 'This field is required' })}
                  placeholder={langEn['countdown.to_start']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Waiting' description='' />
                <Input
                  maxLength={150}
                  {...register('countdown_waiting', { required: 'This field is required' })}
                  placeholder={langEn['countdown.waiting']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Overtime' description='' />
                <Input
                  maxLength={150}
                  {...register('countdown_overtime', { required: 'This field is required' })}
                  placeholder={langEn['countdown.overtime']}
                />
              </Panel.ListItem>
            </Panel.ListGroup>
          </Panel.Card>
          <Panel.Card>
            <Panel.SubHeader>Timeline</Panel.SubHeader>
            <Panel.ListGroup>
              <Panel.ListItem>
                <Panel.Field title='Live' description='' />
                <Input
                  maxLength={150}
                  {...register('timeline_live', { required: 'This field is required' })}
                  placeholder={langEn['timeline.live']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Done' description='' />
                <Input
                  maxLength={150}
                  {...register('timeline_done', { required: 'This field is required' })}
                  placeholder={langEn['timeline.done']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Due' description='' />
                <Input
                  maxLength={150}
                  {...register('timeline_due', { required: 'This field is required' })}
                  placeholder={langEn['timeline.due']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Followed By' description='' />
                <Input
                  maxLength={150}
                  {...register('timeline_followedby', { required: 'This field is required' })}
                  placeholder={langEn['timeline.followedby']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Title' description='' />
                <Input
                  maxLength={150}
                  {...register('project_title', { required: 'This field is required' })}
                  placeholder={langEn['project.title']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Description' description='' />
                <Input
                  maxLength={150}
                  {...register('project_description', { required: 'This field is required' })}
                  placeholder={langEn['project.description']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Backstage info' description='' />
                <Input
                  maxLength={150}
                  {...register('project_backstage_info', { required: 'This field is required' })}
                  placeholder={langEn['project.backstage_info']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Backstage URL' description='' />
                <Input
                  maxLength={150}
                  {...register('project_backstage_url', { required: 'This field is required' })}
                  placeholder={langEn['project.backstage_url']}
                />
              </Panel.ListItem>
            </Panel.ListGroup>
          </Panel.Card>
        </Panel.Section>
      }
      footerElements={
        <div>
          {errors?.root && <Panel.Error>{errors.root.message}</Panel.Error>}
          <Panel.InlineElements align='apart'>
            <Panel.InlineElements>
              <Button size='large' onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant='primary'
                size='large'
                type='submit'
                form='custom-translations-form'
                disabled={isSubmitting || !isDirty}
                loading={isSubmitting}
              >
                Save changes
              </Button>
            </Panel.InlineElements>
          </Panel.InlineElements>
        </div>
      }
    />
  );
}

function transformTranslationObject(
  translation: Record<string, string>,
  from: string,
  to: string,
): Record<string, string> {
  const transformedTranslationObj: Record<string, string> = {};

  Object.entries(translation).forEach(([k, v]) => {
    const translationKey = k.replace(from, to);
    transformedTranslationObj[translationKey] = v;
  });

  return transformedTranslationObj;
}
