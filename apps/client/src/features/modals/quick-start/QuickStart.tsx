import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
} from '@chakra-ui/react';
import type { EventData } from 'ontime-types';

import { EVENT_DATA, RUNDOWN_TABLE } from '../../../common/api/apiConstants';
import { postNew } from '../../../common/api/ontimeApi';
import useEventData from '../../../common/hooks-query/useEventData';
import { ontimeQueryClient } from '../../../common/queryClient';

import styles from '../Modal.module.scss';

interface QuickStartProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function QuickStart({ onClose, isOpen }: QuickStartProps) {
  const { data, status } = useEventData();
  const {
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting },
  } = useForm({ defaultValues: data });

  useEffect(() => {
    reset(data);
  }, [reset, data]);

  const onSubmit = async (data: Partial<EventData>) => {
    await postNew(data);
    await ontimeQueryClient.invalidateQueries(EVENT_DATA);
    await ontimeQueryClient.invalidateQueries(RUNDOWN_TABLE);
  };

  const onReset = () =>
    reset({
      title: '',
      publicUrl: '',
      publicInfo: '',
      backstageUrl: '',
      backstageInfo: '',
    });

  const disableButtons = status !== 'success' || isSubmitting;
  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      closeOnOverlayClick={false}
      motionPreset='slideInBottom'
      size='xl'
      scrollBehavior='inside'
      preserveScrollBarGap
      variant='ontime'
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Ontime quick start</ModalHeader>
        <ModalCloseButton />
        <ModalBody className={styles.pad}>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.sectionContainer}>
            <div className={styles.entryRow}>
              <label className={styles.sectionTitle}>
                Event title
                <Input
                  variant='ontime-filled-on-light'
                  size='sm'
                  maxLength={50}
                  placeholder='Eurovision song contest'
                  {...register('title')}
                />
              </label>
            </div>
            <div className={styles.entryRow}>
              <label className={styles.sectionTitle}>
                Public Info
                <Textarea
                  variant='ontime-filled-on-light'
                  size='sm'
                  maxLength={150}
                  placeholder='Shows always start ontime'
                  {...register('publicInfo')}
                />
              </label>
            </div>
            <div className={styles.entryRow}>
              <label className={styles.sectionTitle}>
                Public QR Code Url
                <Input
                  variant='ontime-filled-on-light'
                  size='sm'
                  placeholder='www.getontime.no'
                  {...register('publicUrl')}
                />
              </label>
            </div>
            <div className={styles.entryRow}>
              <label className={styles.sectionTitle}>
                Backstage Info
                <Textarea
                  variant='ontime-filled-on-light'
                  size='sm'
                  maxLength={150}
                  placeholder='Wi-Fi password: 1234'
                  {...register('backstageInfo')}
                />
              </label>
            </div>
            <div className={styles.entryRow}>
              <label className={styles.sectionTitle}>
                Backstage QR Code Url
                <Input
                  variant='ontime-filled-on-light'
                  size='sm'
                  placeholder='www.ontime.gitbook.io'
                  {...register('backstageUrl')}
                />
              </label>
            </div>
            <div className={styles.footerNotes}>
              Note: Application options will be kept but rundown and event data will be reset <br />
            </div>
            <ModalFooter className={styles.buttonSection}>
              <Button onClick={onReset} isDisabled={disableButtons} variant='ontime-ghost-on-light' size='sm'>
                Clear data
              </Button>
              <Button
                type='submit'
                isLoading={isSubmitting}
                isDisabled={disableButtons}
                variant='ontime-filled'
                padding='0 2em'
                size='sm'
              >
                New showfile
              </Button>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
