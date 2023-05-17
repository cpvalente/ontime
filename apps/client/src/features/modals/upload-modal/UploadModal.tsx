import { ChangeEvent, useCallback, useRef, useState } from 'react';
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
  Progress,
  Switch,
} from '@chakra-ui/react';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import { IoDocumentTextOutline } from '@react-icons/all-files/io5/IoDocumentTextOutline';
import { IoWarningOutline } from '@react-icons/all-files/io5/IoWarningOutline';
import { useQueryClient } from '@tanstack/react-query';

import { RUNDOWN_TABLE } from '../../../common/api/apiConstants';
import { uploadData } from '../../../common/api/ontimeApi';
import { useEmitLog } from '../../../common/stores/logger';
import ModalSplitInput from '../ModalSplitInput';

import { validateFile } from './utils';

import style from './UploadModal.module.scss';

interface UploadModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function UploadModal({ onClose, isOpen }: UploadModalProps) {
  const queryClient = useQueryClient();
  const { emitError } = useEmitLog();
  const [errors, setErrors] = useState<string | undefined>();
  const [isSubmitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const overrideOptionRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState(false);

  const handleFile = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const fileUploaded = event?.target?.files?.[0];
    if (!fileUploaded) return;

    const validate = validateFile(fileUploaded);
    setErrors(validate.errors?.[0]);

    if (validate.isValid) {
      setFile(fileUploaded);
    } else {
      setFile(null);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    if (file) {
      try {
        const options = {
          onlyRundown: overrideOptionRef.current?.checked || false,
        };
        await uploadData(file, setProgress, options);
      } catch (error) {
        emitError(`Failed uploading file: ${error}`);
      } finally {
        await queryClient.invalidateQueries(RUNDOWN_TABLE);
        setSuccess(true);
      }
    }
    setSubmitting(false);
  }, [emitError, file, queryClient]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setFile(null);
  };

  const handleClose = () => {
    clearFile();
    setSuccess(false);
    setErrors(undefined);
    setProgress(0);
    onClose();
  };

  const disableSubmit = !file || isSubmitting;

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen}
      closeOnOverlayClick={false}
      motionPreset='slideInBottom'
      size='xl'
      scrollBehavior='inside'
      preserveScrollBarGap
      variant='ontime-small'
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>File import</ModalHeader>
        <ModalCloseButton />
        <ModalBody className={style.uploadBody}>
          <Input
            ref={fileInputRef}
            style={{ display: 'none' }}
            type='file'
            onChange={handleFile}
            accept='.json, .xlsx'
            data-testid='file-input'
          />
          <div className={style.uploadArea} onClick={handleClick}>
            Click to upload Ontime project file
          </div>
          {file && (
            <div className={`${style.uploadedItem} ${success ? style.success : ''}`}>
              <IoClose className={style.cancelUpload} onClick={clearFile} />
              <IoDocumentTextOutline className={style.icon} />
              <span className={style.fileTitle}>{file.name}</span>
              <span className={style.fileInfo}>{`${(file.size / 1024).toFixed(2)}kb - ${file.type}`}</span>
              <Progress variant='ontime-on-light' className={style.fileProgress} value={progress} />
            </div>
          )}
          {errors && (
            <div className={`${style.uploadedItem} ${style.error}`}>
              <IoWarningOutline className={style.icon} />
              <span className={style.fileTitle}>{errors}</span>
              <span className={style.fileInfo}>Please try again</span>
              <Progress className={style.fileProgress} value={progress} />
            </div>
          )}
          <div className={style.uploadOptions}>
            <span className={style.title}>Import options</span>
            <ModalSplitInput
              field=''
              title='Only import rundown'
              description='All other options, including application settings will be discarded'
            >
              <Switch variant='ontime-on-light' ref={overrideOptionRef} />
            </ModalSplitInput>
          </div>
        </ModalBody>
        <ModalFooter className={`${style.buttonSection} ${style.pad}`}>
          <Button onClick={handleClose} isDisabled={isSubmitting} variant='ontime-ghost-on-light' size='sm'>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={disableSubmit}
            variant='ontime-filled'
            padding='0 2em'
            size='sm'
          >
            Import
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
