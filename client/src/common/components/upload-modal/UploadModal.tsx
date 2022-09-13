import { ChangeEvent, useCallback, useContext, useState } from 'react';
import { Button } from '@chakra-ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Tag,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';

import { EVENTS_TABLE } from '../../api/apiConstants';
import { uploadEvents } from '../../api/ontimeApi';
import { LoggingContext } from '../../context/LoggingContext';

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
        await uploadEvents(file, setProgress);
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
          {file && (
            <Alert status='info' variant='subtle' flexDirection='column' alignItems='start'>
              <AlertTitle>File ready to upload</AlertTitle>
              <AlertDescription>
                <HStack>
                  <Tag size='sm'>{file.name}</Tag>
                  <Tag size='sm'>{`${(file.size / 1024).toFixed(2)}kb`}</Tag>
                  <Tag size='sm'>{file.type}</Tag>
                </HStack>
                <div className={style.options}>
                  Options
                  <Checkbox defaultChecked isDisabled>
                    Override existing database
                  </Checkbox>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {typeof progress !== 'undefined' && <Progress value={progress} />}
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
