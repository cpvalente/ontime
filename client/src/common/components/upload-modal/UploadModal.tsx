import { ChangeEvent, useCallback, useContext, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
} from '@chakra-ui/react';
import { IoCloseSharp } from '@react-icons/all-files/io5/IoCloseSharp';
import { useQueryClient } from '@tanstack/react-query';

import { EVENTS_TABLE } from '../../api/apiConstants';
import { uploadEvents } from '../../api/ontimeApi';
import { LoggingContext } from '../../context/LoggingContext';
import TooltipActionBtn from '../buttons/TooltipActionBtn';

import { validateFile } from './utils';

import style from './UploadModal.module.scss';

interface UploadModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function UploadModal({ onClose, isOpen }: UploadModalProps) {
  const queryClient = useQueryClient();
  const { emitError } = useContext(LoggingContext);
  const [errors, setErrors] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const overrideOptionRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const fileUploaded = event?.target?.files?.[0];
    if (!fileUploaded) return;

    const validate = validateFile(fileUploaded);
    setErrors(validate.errors);

    if (validate.isValid) {
      setFile(fileUploaded);
    } else {
      setFile(null);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (file) {
      try {
        await uploadEvents(file, setProgress, { onlyEvents: overrideOptionRef?.current?.checked });
      } catch (error) {
        emitError(`Failed uploading file: ${error}`);
      } finally {
        await queryClient.invalidateQueries(EVENTS_TABLE);
        setFile(null);
      }
    }
  }, [emitError, file, queryClient]);

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      closeOnOverlayClick={false}
      motionPreset='slideInBottom'
      size='xl'
      scrollBehavior='inside'
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>File upload</ModalHeader>
        <ModalCloseButton />
        <ModalBody className={style.modalBody}>
          <FormControl isInvalid={errors.length > 0}>
            <FormLabel>Select file to upload</FormLabel>
            <Input type='file' onChange={handleFile} accept='.json, .xlsx' />
            {errors.length === 0 ? (
              <FormHelperText>.XLSX .JSON with max 1MB</FormHelperText>
            ) : (
              <FormErrorMessage className={style.flexColumnLeft}>
                {errors.map((error) => (
                  <span key={error}>{error}</span>
                ))}
              </FormErrorMessage>
            )}
          </FormControl>
          <div className={style.options}>
            <b>Options</b>
            <Checkbox ref={overrideOptionRef}>Import only events</Checkbox>
            <span className={style.notes}>This will prevent overriding user settings</span>
          </div>
          {file && (
            <div className={style.info}>
              <span>File ready to upload</span>
              <TooltipActionBtn
                clickHandler={() => setFile(null)}
                tooltip='Cancel'
                aria-label='Cancel'
                className={style.corner}
                size='sm'
                variant='ghosted'
                icon={<IoCloseSharp />}
              />
              <ul className={style.infoList}>
                <li>{file.name}</li>
                <li>{`${(file.size / 1024).toFixed(2)}kb`}</li>
                <li>{file.type}</li>
              </ul>
            </div>
          )}
          <Progress value={progress} />
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme='blue'
            disabled={!file || errors.length > 0}
            onClick={handleUpload}
            isLoading={progress < 0 && progress >= 100}
          >
            Upload
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
