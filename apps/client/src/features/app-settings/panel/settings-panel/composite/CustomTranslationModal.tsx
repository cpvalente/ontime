import { useMemo } from 'react';
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

  const defaultValues = useMemo(() => translateToFormData(userTranslation), [userTranslation]);

  const {
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isDirty, errors },
    setError,
  } = useForm({
    defaultValues,
    resetOptions: {
      keepDirtyValues: true,
    },
    mode: 'onChange',
  });

  const onSubmit = async (formData: Record<string, string>) => {
    try {
      const translationData = translateToApiData(formData) as TranslationObject;
      await postUserTranslation(translationData);
      reset(formData);
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
                  {...register('expected_finish', {
                    required: 'This field is required',
                  })}
                  placeholder={langEn['common.expected_finish']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Minutes' description='' />
                <Input
                  maxLength={150}
                  {...register('minutes', { required: 'This field is required' })}
                  placeholder={langEn['common.minutes']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Now' description='' />
                <Input
                  maxLength={150}
                  {...register('now', { required: 'This field is required' })}
                  placeholder={langEn['common.now']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Next' description='' />
                <Input
                  maxLength={150}
                  {...register('next', { required: 'This field is required' })}
                  placeholder={langEn['common.next']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Scheduled Start' description='' />
                <Input
                  maxLength={150}
                  {...register('scheduled_start', { required: 'This field is required' })}
                  placeholder={langEn['common.scheduled_start']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Scheduled End' description='' />
                <Input
                  maxLength={150}
                  {...register('scheduled_end', { required: 'This field is required' })}
                  placeholder={langEn['common.scheduled_end']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Projected Start' description='' />
                <Input
                  maxLength={150}
                  {...register('projected_start', { required: 'This field is required' })}
                  placeholder={langEn['common.projected_start']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Projected End' description='' />
                <Input
                  maxLength={150}
                  {...register('projected_end', { required: 'This field is required' })}
                  placeholder={langEn['common.projected_end']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Stage Timer' description='' />
                <Input
                  maxLength={150}
                  {...register('stage_timer', { required: 'This field is required' })}
                  placeholder={langEn['common.stage_timer']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Started At' description='' />
                <Input
                  maxLength={150}
                  {...register('started_at', { required: 'This field is required' })}
                  placeholder={langEn['common.started_at']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Time Now' description='' />
                <Input
                  maxLength={150}
                  {...register('time_now', { required: 'This field is required' })}
                  placeholder={langEn['common.time_now']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='No data' description='' />
                <Input
                  maxLength={150}
                  {...register('no_data', { required: 'This field is required' })}
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
                  {...register('ended', { required: 'This field is required' })}
                  placeholder={langEn['countdown.ended']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Running' description='' />
                <Input
                  maxLength={150}
                  {...register('running', { required: 'This field is required' })}
                  placeholder={langEn['countdown.running']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Select Event' description='' />
                <Input
                  maxLength={150}
                  {...register('select_event', { required: 'This field is required' })}
                  placeholder={langEn['countdown.select_event']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='To start' description='' />
                <Input
                  maxLength={150}
                  {...register('to_start', { required: 'This field is required' })}
                  placeholder={langEn['countdown.to_start']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Waiting' description='' />
                <Input
                  maxLength={150}
                  {...register('waiting', { required: 'This field is required' })}
                  placeholder={langEn['countdown.waiting']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Overtime' description='' />
                <Input
                  maxLength={150}
                  {...register('overtime', { required: 'This field is required' })}
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
                  {...register('live', { required: 'This field is required' })}
                  placeholder={langEn['timeline.live']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Done' description='' />
                <Input
                  maxLength={150}
                  {...register('done', { required: 'This field is required' })}
                  placeholder={langEn['timeline.done']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Due' description='' />
                <Input
                  maxLength={150}
                  {...register('due', { required: 'This field is required' })}
                  placeholder={langEn['timeline.due']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Followed By' description='' />
                <Input
                  maxLength={150}
                  {...register('followedby', { required: 'This field is required' })}
                  placeholder={langEn['timeline.followedby']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Title' description='' />
                <Input
                  maxLength={150}
                  {...register('title', { required: 'This field is required' })}
                  placeholder={langEn['project.title']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Description' description='' />
                <Input
                  maxLength={150}
                  {...register('description', { required: 'This field is required' })}
                  placeholder={langEn['project.description']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Project info' description='' />
                <Input
                  maxLength={150}
                  {...register('info', { required: 'This field is required' })}
                  placeholder={langEn['project.info']}
                />
              </Panel.ListItem>
              <Panel.ListItem>
                <Panel.Field title='Project URL' description='' />
                <Input
                  maxLength={150}
                  {...register('url', { required: 'This field is required' })}
                  placeholder={langEn['project.url']}
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

const TRANSLATION_KEY_MAP = {
  expected_finish: 'common.expected_finish',
  minutes: 'common.minutes',
  now: 'common.now',
  next: 'common.next',
  scheduled_start: 'common.scheduled_start',
  scheduled_end: 'common.scheduled_end',
  projected_start: 'common.projected_start',
  projected_end: 'common.projected_end',
  stage_timer: 'common.stage_timer',
  started_at: 'common.started_at',
  time_now: 'common.time_now',
  no_data: 'common.no_data',
  ended: 'countdown.ended',
  running: 'countdown.running',
  select_event: 'countdown.select_event',
  to_start: 'countdown.to_start',
  waiting: 'countdown.waiting',
  overtime: 'countdown.overtime',
  live: 'timeline.live',
  done: 'timeline.done',
  due: 'timeline.due',
  followedby: 'timeline.followedby',
  title: 'project.title',
  description: 'project.description',
  info: 'project.info',
  url: 'project.url',
} as const;

function translateToFormData(userTranslation: TranslationObject) {
  return Object.fromEntries(
    Object.entries(TRANSLATION_KEY_MAP).map(([formKey, translationKey]) => [formKey, userTranslation[translationKey]]),
  );
}

function translateToApiData(formData: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(formData).map(([formKey, value]) => [
      TRANSLATION_KEY_MAP[formKey as keyof typeof TRANSLATION_KEY_MAP],
      value
    ])
  );
}
