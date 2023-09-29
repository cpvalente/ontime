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
import { OntimeRundown, ProjectData, UserFields } from 'ontime-types';
import { defaultExcelImportMap, ExcelImportMap } from 'ontime-utils';

import { invalidateAllCaches, maybeAxiosError } from '../../../common/api/apiUtils';
import {
  patchData,
  postPreviewExcel,
  ProjectFileImportOptions,
  uploadProjectFile,
} from '../../../common/api/ontimeApi';
import { projectDataPlaceholder } from '../../../common/models/ProjectData';
import { userFieldsPlaceholder } from '../../../common/models/UserFields';

import PreviewExcel from './preview/PreviewExcel';
import ExcelFileOptions from './upload-options/ExcelFileOptions';
import OntimeFileOptions from './upload-options/OntimeFileOptions';
import UploadStepTracker from './upload-step/UploadStep';
import UploadFile from './UploadFile';
import { useUploadModalContextStore } from './uploadModalContext';
import { isExcelFile, isOntimeFile } from './uploadUtils';

import style from './UploadModal.module.scss';
import { PROJECT_DATA, RUNDOWN_TABLE, USERFIELDS } from '../../../common/api/apiConstants';

export type UploadStep = 'upload' | 'review';

interface UploadModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function UploadModal({ onClose, isOpen }: UploadModalProps) {
  const queryClient = useQueryClient();

  const { file, setProgress, clear } = useUploadModalContextStore();

  const [uploadStep, setUploadStep] = useState<UploadStep>('upload');
  const [submitting, setSubmitting] = useState(false);
  const [rundown, setRundown] = useState<OntimeRundown | null>(null);
  const [userFields, setUserFields] = useState<UserFields | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);

  const [errors, setErrors] = useState('');

  const ontimeFileOptions = useRef<Partial<ProjectFileImportOptions>>({});
  const excelFileOptions = useRef<ExcelImportMap>(defaultExcelImportMap);

  /* if the modal re-opens, we want to restart all states */
  useEffect(() => {
    clear();
    setUploadStep('upload');
    setSubmitting(false);
    setRundown(null);
    setUserFields(null);
    setProject(null);
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
          doClose = true;
        } else if (isExcelFile(file)) {
          const options = excelFileOptions.current;
          await handleExcelFile(file, options);
          await invalidateAllCaches();
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

    // when we upload excel, we populate state with preview data
    async function handleExcelFile(file: File, options: ExcelImportMap) {
      const response = await postPreviewExcel(file, setProgress, options);
      if (response.status === 200) {
        setRundown(response.data.rundown);
        setUserFields(response.data.userFields);
        setProject(response.data.project);
        // in excel imports we have an extra review step
        setUploadStep('review');
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
    setUserFields(userFieldsPlaceholder);
    setProject(projectDataPlaceholder);
    onClose();
  };

  const handleFinalise = async () => {
    // this step is currently only used for excel files, after preview
    if (isExcel && rundown && userFields && project) {
      let doClose = false;
      setSubmitting(true);
      try {
        await patchData({ rundown, userFields, project });
        queryClient.setQueryData(RUNDOWN_TABLE, rundown);
        queryClient.setQueryData(USERFIELDS, userFields);
        queryClient.setQueryData(PROJECT_DATA, project);
        await queryClient.invalidateQueries({
          queryKey: [...RUNDOWN_TABLE, ...USERFIELDS, ...PROJECT_DATA],
        });
        doClose = true;
      } catch (error) {
        const message = maybeAxiosError(error);
        setErrors(`Failed applying changes ${message}`);
      } finally {
        setSubmitting(false);
        if (doClose) {
          handleClose();
        }
      }
    }
  };

  const undoReview = () => {
    setUploadStep('upload');
    setErrors('');
  };

  const isUpload = uploadStep === 'upload';
  const isReview = uploadStep === 'review';
  const isExcel = isExcelFile(file);
  const isOntime = isOntimeFile(file);

  const handleGoBack = isUpload ? undefined : undoReview;
  const handleSubmit = isUpload ? handleUpload : handleFinalise;
  const disableSubmit = (isUpload && !file) || (isReview && rundown === null);
  const disableGoBack = isUpload;
  const submitText = isUpload ? 'Upload' : 'Finish';

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
              {isOntime && <OntimeFileOptions optionsRef={ontimeFileOptions} />}
              {isExcel && <ExcelFileOptions optionsRef={excelFileOptions} />}
            </>
          ) : (
            <PreviewExcel
              rundown={rundown ?? []}
              project={project ?? projectDataPlaceholder}
              userFields={userFields ?? userFieldsPlaceholder}
            />
          )}
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
