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
import { useQueryClient } from '@tanstack/react-query';
import { OntimeRundown } from 'ontime-types';

import { RUNDOWN_TABLE } from '../../../common/api/apiConstants';
import { postPreviewExcel, uploadData } from '../../../common/api/ontimeApi';
import { projectDataPlaceholder } from '../../../common/models/ProjectData';
import { userFieldsPlaceholder } from '../../../common/models/UserFields';
import { cx } from '../../../common/utils/styleUtils';

import ExcelFileOptions from './upload-options/ExcelFileOptions';
import OntimeFileOptions from './upload-options/OntimeFileOptions';
import UploadStepTracker from './upload-step/UploadStep';
import ReviewFile from './ReviewExcel';
import UploadFile from './UploadFile';
import { useUploadModalContextStore } from './uploadModalContext';
import { defaultExcelImportMap, ExcelImportMapKeys, isExcelFile, isOntimeFile } from './uploadUtils';

import style from './UploadModal.module.scss';

export type UploadStep = 'upload' | 'review';

export interface OntimeInputOptions {
  onlyImportRundown?: boolean;
}

export type ExcelInputOptions = {
  [K in ExcelImportMapKeys]: string;
};

interface UploadModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function UploadModal({ onClose, isOpen }: UploadModalProps) {
  const queryClient = useQueryClient();

  const { file, setProgress, clear } = useUploadModalContextStore();

  const [uploadStep, setUploadStep] = useState<UploadStep>('upload');
  const [submitting, setSubmitting] = useState(false);
  const [rundown, setRundown] = useState<OntimeRundown>([]);
  const [userFields, setUserFields] = useState(userFieldsPlaceholder);
  const [project, setProject] = useState(projectDataPlaceholder);

  const [errors, setErrors] = useState('');

  const ontimeFileOptions = useRef<Partial<OntimeInputOptions>>({});
  const excelFileOptions = useRef<Partial<ExcelInputOptions>>(defaultExcelImportMap);

  useEffect(() => {
    clear();
    setUploadStep('upload');
    setSubmitting(false);
    setRundown([]);
    setUserFields(userFieldsPlaceholder);
    setProject(projectDataPlaceholder);
    setErrors('');
  }, [clear, isOpen]);

  const handleParse = async () => {
    if (file) {
      setSubmitting(true);
      try {
        if (isOntimeFile(file)) {
          await handleOntimeFile(file);
          await queryClient.invalidateQueries(RUNDOWN_TABLE);
        } else if (isExcelFile(file)) {
          await handleExcelFile(file);
        }
      } catch (error) {
        setErrors(`Failed uploading file: ${error}`);
      } finally {
        setSubmitting(false);
      }
    }

    async function handleExcelFile(file: File) {
      const options = excelFileOptions.current;
      // TODO: option type should be central, to also be used by backend
      const response = await postPreviewExcel(file, setProgress, options);
      if (response.status === 200) {
        setRundown(response.data.rundown);
        setUserFields(response.data.userFields);
        setProject(response.data.project);
        setUploadStep('review');
      }
    }

    async function handleOntimeFile(file: File) {
      const options = {
        onlyRundown: Boolean(ontimeFileOptions.current.onlyImportRundown),
      };
      await uploadData(file, setProgress, options);
    }
  };

  const handleClose = () => {
    clear();
    setRundown([]);
    setUserFields(userFieldsPlaceholder);
    setProject(projectDataPlaceholder);
    onClose();
  };

  const handleFinalise = async () => {
    if (file) {
      setSubmitting(true);
      try {
        const options = {
          //onlyRundown: overrideOptionRef.current?.checked || false,
        };
        await uploadData(file, setProgress, options);
        handleClose();
      } catch (error) {
        console.error(error);
      } finally {
        await queryClient.invalidateQueries(RUNDOWN_TABLE);
        setSubmitting(false);
      }
    }
  };

  const isUpload = uploadStep === 'upload';
  const isExcel = isExcelFile(file);
  const isOntime = isOntimeFile(file);

  const handleGoBack = isUpload ? undefined : () => setUploadStep('upload');
  const handleSubmit = isUpload ? handleParse : handleFinalise;
  const disableSubmit = isUpload && !file;
  const disableGoBack = isUpload;
  const submitText = isUpload ? 'Upload' : 'Finish';

  const modalClasses = cx([style.modalWidthOverride, isExcel ? style.doExtend : null]);

  console.log('debug', isExcel, modalClasses);
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
          {isExcel && <UploadStepTracker uploadStep={uploadStep} />}
          {uploadStep === 'upload' ? (
            <>
              <UploadFile />
              {errors && <div className={style.error}>{errors}</div>}
              {isOntime && <OntimeFileOptions optionsRef={ontimeFileOptions} />}
              {isExcel && <ExcelFileOptions optionsRef={excelFileOptions} />}
            </>
          ) : (
            <ReviewFile rundown={rundown} project={project} userFields={userFields} />
          )}
        </ModalBody>
        <ModalFooter className={`${style.buttonSection} ${style.pad}`}>
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
