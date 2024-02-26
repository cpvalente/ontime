import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { OntimeRundown } from 'ontime-types';

import { invalidateAllCaches, maybeAxiosError } from '../../../common/api/apiUtils';
import { ProjectFileImportOptions, uploadProjectFile } from '../../../common/api/ontimeApi';
import { isOntimeFile } from '../../../common/utils/uploadUtils';

import OntimeFileOptions from './upload-options/OntimeFileOptions';
import UploadFile from './UploadFile';
import { useUploadModalContextStore } from './uploadModalContext';

import style from './UploadModal.module.scss';

export type UploadStep = 'import' | 'review';

interface UploadModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function UploadModal({ onClose, isOpen }: UploadModalProps) {
  const { file, setProgress, clear } = useUploadModalContextStore();

  const [uploadStep, setUploadStep] = useState<UploadStep>('import');
  const [submitting, setSubmitting] = useState(false);
  const [rundown, setRundown] = useState<OntimeRundown | null>(null);

  const [errors, setErrors] = useState('');

  const ontimeFileOptions = useRef<Partial<ProjectFileImportOptions>>({});

  const updateOntimeFileOptions = <T extends keyof ProjectFileImportOptions>(
    field: T,
    value: ProjectFileImportOptions[T],
  ) => {
    ontimeFileOptions.current = { ...ontimeFileOptions.current, [field]: value };
  };

  // if the modal re-opens, we want to restart all states
  useEffect(() => {
    clear();
    setUploadStep('import');
    setSubmitting(false);
    setRundown(null);
    setErrors('');
  }, [clear, isOpen]);

  /* uploads file to backend
   * - in the case of excel, we get the preview
   * - in the case of project file, this is end of line
   **/
  const handleUpload = async () => {
    let doClose = false;
    if (file) {
      setSubmitting(true);
      setErrors('');
      try {
        if (isOntimeFile(file)) {
          // TODO: we would also like to have preview for ontime project files
          const options = ontimeFileOptions.current;
          await handleOntimeFile(file, options);
          await invalidateAllCaches();
          doClose = true;
        }
      } catch (error) {
        const message = maybeAxiosError(error);
        setErrors(`Failed uploading file ${message}`);
      } finally {
        setSubmitting(false);
        if (doClose) {
          handleClose();
        }
      }
    }

    // when we upload project files, no extra operations are done
    async function handleOntimeFile(file: File, options: Partial<ProjectFileImportOptions>) {
      await uploadProjectFile(file, setProgress, options);
    }
  };

  // before closing the modal, we clear data from mutations
  const handleClose = () => {
    clear();
    setRundown([]);
    // setUserFields(userFieldsPlaceholder);
    onClose();
  };

  const undoReview = () => {
    setUploadStep('import');
    setErrors('');
  };

  const isImporting = uploadStep === 'import';
  const isReview = uploadStep === 'review';
  const isOntime = isOntimeFile(file);

  const handleGoBack = isImporting ? undefined : undoReview;
  const handleSubmit = handleUpload;
  const disableSubmit = (isImporting && !file) || (isReview && rundown === null);
  const disableGoBack = isImporting;
  const submitText = isImporting ? 'Import' : 'Finish';

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen}
      closeOnOverlayClick={false}
      motionPreset='slideInBottom'
      size='xl'
      scrollBehavior='inside'
      preserveScrollBarGap
      variant='ontime-upload'
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>File import</ModalHeader>
        <ModalCloseButton />
        <ModalBody className={style.uploadBody}>
          <>
            <UploadFile />
            {isOntime && <OntimeFileOptions optionsRef={ontimeFileOptions} updateOptions={updateOntimeFileOptions} />}
          </>
        </ModalBody>
        <ModalFooter>
          <div className={style.feedbackSection}>{errors && <div className={style.error}>{errors}</div>}</div>
          <div className={`${style.buttonSection} ${style.pad}`}>
            <Button
              onClick={handleGoBack}
              isDisabled={disableGoBack || submitting}
              variant='ontime-ghost-on-light'
              size='sm'
            >
              Go Back
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={submitting}
              isDisabled={disableSubmit}
              variant='ontime-filled'
              padding='0 2em'
              size='sm'
            >
              {submitText}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
