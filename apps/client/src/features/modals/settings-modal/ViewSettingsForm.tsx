import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Input, Switch } from '@chakra-ui/react';
import { ViewSettings } from 'ontime-types';

import { logAxiosError } from '../../../common/api/apiUtils';
import { postViewSettings } from '../../../common/api/ontimeApi';
import { PopoverPickerRHF } from '../../../common/components/input/popover-picker/PopoverPicker';
import useInfo from '../../../common/hooks-query/useInfo';
import useViewSettings from '../../../common/hooks-query/useViewSettings';
import { mtm } from '../../../common/utils/timeConstants';
import ModalLoader from '../modal-loader/ModalLoader';
import { inputProps } from '../modalHelper';
import ModalInput from '../ModalInput';
import ModalLink from '../ModalLink';
import ModalSplitInput from '../ModalSplitInput';
import OntimeModalFooter from '../OntimeModalFooter';

import InputMillisWithString from './InputMillisWithString';

import style from './SettingsModal.module.scss';

const cssOverrideDocsUrl = 'https://ontime.gitbook.io/v2/features/custom-styling';

export default function ViewSettingsForm() {
  const { data, status, refetch, isFetching } = useViewSettings();
  const { data: info, isFetching: isFetchingInfo } = useInfo();

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, isDirty, isValid, dirtyFields },
  } = useForm<ViewSettings>({
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

  const onSubmit = async (formData: ViewSettings) => {
    const parsedWarningThreshold = dirtyFields?.warningThreshold
      ? // @ts-expect-error -- trust me
        Number.parseInt(formData.warningThreshold) * mtm
      : formData.warningThreshold;
    const parsedDangerThreshold = dirtyFields?.dangerThreshold
      ? // @ts-expect-error -- trust me
        Number.parseInt(formData.dangerThreshold) * mtm
      : formData.dangerThreshold;

    const newData = {
      ...formData,
      warningThreshold: parsedWarningThreshold,
      dangerThreshold: parsedDangerThreshold,
    };

    try {
      await postViewSettings(newData);
    } catch (error) {
      logAxiosError('Error saving view settings', error);
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

  const disableInputs = status === 'pending';

  if (isFetching || isFetchingInfo) {
    return <ModalLoader />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} id='view-settings' className={style.sectionContainer}>
      <span className={style.title}>General view settings</span>
      <Alert status='info' variant='ontime-on-light-info'>
        <AlertIcon />
        <div className={style.column}>
          <AlertTitle>CSS Override</AlertTitle>
          <AlertDescription>
            Ontime will use the CSS file at its install location. <br />
            <span className={style.url}>{info?.cssOverride}</span>
            <ModalLink href={cssOverrideDocsUrl}>For more information, see the docs</ModalLink>
          </AlertDescription>
        </div>
      </Alert>
      <ModalSplitInput
        field='overrideStyles'
        title='Override CSS Styles'
        description='Enables overriding view styles with custom stylesheet'
      >
        <Switch {...register('overrideStyles')} variant='ontime-on-light' />
      </ModalSplitInput>
      <span className={style.title}>Timer view settings</span>
      <ModalSplitInput field='normalColor' title='Timer colour' description='Normal colour of a running timer'>
        <PopoverPickerRHF name='normalColor' control={control} />
      </ModalSplitInput>
      <ModalSplitInput
        field='warningColor'
        title='Warning Color'
        description='Time (in minutes) when the timer moves to warning mode'
      >
        <InputMillisWithString name='warningThreshold' control={control} />
      </ModalSplitInput>
      <ModalSplitInput field='warningColor' title='Warning Color' description='Colour of timer in warning mode'>
        <PopoverPickerRHF name='warningColor' control={control} />
      </ModalSplitInput>
      <ModalSplitInput
        field='dangerThreshold'
        title='Danger colour'
        description='Time (in minutes) when the timer moves to danger mode'
      >
        <InputMillisWithString name='dangerThreshold' control={control} />
      </ModalSplitInput>
      <ModalSplitInput field='dangerColor' title='Timer colour' description='Colour of timer in danger mode'>
        <PopoverPickerRHF name='dangerColor' control={control} />
      </ModalSplitInput>
      <div style={{ height: '16px' }} />
      <ModalInput
        field='endMessage'
        title='End Message'
        description='If no end message is provided, timer will continue in overtime mode'
      >
        <Input
          {...inputProps}
          variant='ontime-filled-on-light'
          maxLength={150}
          placeholder='Message to be shown when timer reaches end'
          isDisabled={disableInputs}
          {...register('endMessage')}
        />
      </ModalInput>
      <OntimeModalFooter
        formId='view-settings'
        handleRevert={onReset}
        isDirty={isDirty}
        isValid={isValid}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
