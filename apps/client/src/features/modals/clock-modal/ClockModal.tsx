import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import { Input, Select } from '@chakra-ui/react';
import { type Settings, ClockSource } from 'ontime-types';

import { logAxiosError } from '../../../common/api/apiUtils';
import { postSettings } from '../../../common/api/ontimeApi';
import useSettings from '../../../common/hooks-query/useSettings';
import ModalLoader from '../modal-loader/ModalLoader';
import ModalSplitInput from '../ModalSplitInput';
import OntimeModalFooter from '../OntimeModalFooter';

import styles from '../Modal.module.scss';

interface ClockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal(props: ClockModalProps) {
  const { isOpen, onClose } = props;
  const { data, isFetching, refetch } = useSettings();
  const {
    handleSubmit,
    register,
    reset,
    getValues,
    formState: { errors, isSubmitting, isDirty, isValid },
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

  const onReset = () => {
    reset(data);
  };

  const disableInputs = false; // = status === 'loading';

  if (isFetching) {
    return <ModalLoader />;
  }
  return (
    <Modal
      size='xl'
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      motionPreset='slideInBottom'
      scrollBehavior='inside'
      preserveScrollBarGap
      variant='ontime-big'
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          About Ontime
          <ModalCloseButton />
        </ModalHeader>

        <ModalBody className={styles.body}>
          <form onSubmit={handleSubmit(onSubmit)} id='app-settings' className={styles.sectionContainer}>
            <ModalSplitInput
              field='clockSettings.source'
              title='Clock Source'
              description='Language for static fields in views'
              error={errors.clockSettings?.message}
            >
              <Select
                backgroundColor='white'
                size='sm'
                width='auto'
                isDisabled={disableInputs}
                defaultValue={data?.clockSettings.source}
                {...register('clockSettings.source')}
              >
                <option value={ClockSource.System}>System</option>
                <option value={ClockSource.NTP}>NTP</option>
              </Select>
            </ModalSplitInput>
            {getValues('clockSettings.source') == ClockSource.System ? (
              <ModalSplitInput
                field='clockSettings.offset'
                title='Clock offset'
                description='Clock offset'
                error={errors.clockSettings?.message}
              >
                <Input
                  size='sm'
                  width='auto'
                  type='number'
                  variant='ontime-filled-on-light'
                  isDisabled={disableInputs}
                  {...register('clockSettings.offset')}
                />
              </ModalSplitInput>
            ) : (
              <>
                <ModalSplitInput
                  field='clockSettings.settings'
                  title='Clock input settings'
                  description='NTP source'
                  error={errors.clockSettings?.message}
                >
                  <Input
                    size='sm'
                    width='auto'
                    variant='ontime-filled-on-light'
                    placeholder='0.dk.pool.ntp.org, 1.dk.pool.ntp.org, 2.dk.pool.ntp.org'
                    isDisabled={disableInputs}
                    {...register('clockSettings.settings')}
                  />
                </ModalSplitInput>
                <ModalSplitInput
                  field='clockSettings.offset'
                  title='Clock offset'
                  description='Clock offset'
                  error={errors.clockSettings?.message}
                >
                  <Input
                    size='sm'
                    width='auto'
                    type='number'
                    variant='ontime-filled-on-light'
                    isDisabled={disableInputs}
                    {...register('clockSettings.offset')}
                  />
                </ModalSplitInput>
              </>
            )}

            <OntimeModalFooter
              formId='app-settings'
              handleRevert={onReset}
              isDirty={isDirty}
              isValid={isValid}
              isSubmitting={isSubmitting}
            />
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
