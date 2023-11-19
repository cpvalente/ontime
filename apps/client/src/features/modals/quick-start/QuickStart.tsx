import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
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
import type { ProjectData } from 'ontime-types';

import { PROJECT_DATA, RUNDOWN } from '../../../common/api/apiConstants';
import { postNew } from '../../../common/api/ontimeApi';
import useProjectData from '../../../common/hooks-query/useProjectData';
import { projectDataPlaceholder } from '../../../common/models/ProjectData';
import { ontimeQueryClient } from '../../../common/queryClient';

import styles from '../Modal.module.scss';

interface QuickStartProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function QuickStart({ onClose, isOpen }: QuickStartProps) {
  const { data, status } = useProjectData();
  const {
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: data,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const onSubmit = async (data: Partial<ProjectData>) => {
    try {
      await postNew(data);
      await ontimeQueryClient.invalidateQueries({ queryKey: PROJECT_DATA });
      await ontimeQueryClient.invalidateQueries({ queryKey: RUNDOWN });

      onClose();
    } catch (_) {
      /* WE DO NOT HANDLE ERRORS */
    }
  };

  const onReset = () => reset(projectDataPlaceholder);

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
            <Alert status='info' variant='ontime-on-light-info'>
              <AlertIcon />
              <div className={styles.column}>
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  On submit, application options will be kept but rundown and project data will be reset
                </AlertDescription>
              </div>
            </Alert>
            <div className={styles.entryRow}>
              <label className={styles.sectionTitle}>
                Project title
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
                Project description
                <Input
                  variant='ontime-filled-on-light'
                  size='sm'
                  maxLength={100}
                  placeholder='Euro Love, Malmö 2024'
                  {...register('description')}
                />
              </label>
            </div>
            <div className={styles.entryRow}>
              <label className={styles.sectionTitle}>
                Public info
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
                Public QR code Url
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
                Backstage info
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
                Backstage QR code Url
                <Input
                  variant='ontime-filled-on-light'
                  size='sm'
                  placeholder='www.ontime.gitbook.io'
                  {...register('backstageUrl')}
                />
              </label>
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
                New project file
              </Button>
            </ModalFooter>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
