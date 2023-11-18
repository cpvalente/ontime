import { ChangeEvent, useRef, useState } from 'react';
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
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getSheetsAuthStatus,
  getSheetsAuthUrl,
  postPreviewSheet,
  uploadSheetClientFile,
  patchData,
} from '../../../common/api/ontimeApi';
import { OntimeRundown, ProjectData, UserFields } from 'ontime-types';

import PreviewExcel from '../upload-modal/preview/PreviewExcel';
import { projectDataPlaceholder } from '../../../common/models/ProjectData';
import { userFieldsPlaceholder } from '../../../common/models/UserFields';
import { PROJECT_DATA, RUNDOWN_TABLE, USERFIELDS } from '../../../common/api/apiConstants';
import { maybeAxiosError } from '../../../common/api/apiUtils';

interface SheetsModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function SheetsModal(props: SheetsModalProps) {
  const { isOpen, onClose } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [authState, setAuthState] = useState<boolean>(true);

  const [rundown, setRundown] = useState<OntimeRundown | null>(null);
  const [userFields, setUserFields] = useState<UserFields | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);

  const queryClient = useQueryClient();

  const sheetid = useRef<HTMLInputElement>(null);
  const worksheet = useRef<HTMLInputElement>(null);
  const handleClose = () => {
    setRundown(null);
    setProject(null);
    setUserFields(null);
    onClose();
  };
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event?.target?.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    } else {
      uploadSheetClientFile(selectedFile);
    }
    setFile(selectedFile);
  };

  //TODO: do smoething better here
  getSheetsAuthStatus().then((data) => {
    setAuthState(data);
  });

  const handleAuthenticate = () => {
    getSheetsAuthUrl().then((data) => {
      console.log(data);
      if (data == 'bad') {
      } else {
        window.open(data, '_blank', 'noreferrer');
      }
    });
  };
  const handlePullData = () => {
    postPreviewSheet(sheetid.current?.value ?? '', worksheet.current?.value ?? '').then((data) => {
      setProject(data.project);
      setRundown(data.rundown);
      setUserFields(data.userFields);
    });
  };

  const handleFinalise = async () => {
    // this step is currently only used for excel files, after preview
    if (rundown && userFields && project) {
      let doClose = false;
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
        console.log(message);
        // setErrors(`Failed applying changes ${message}`);
      } finally {
        if (doClose) {
          handleClose();
        }
      }
    }
  };

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
        <ModalHeader>Sheets!</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {rundown && (
            <>
              <PreviewExcel
                rundown={rundown ?? []}
                project={project ?? projectDataPlaceholder}
                userFields={userFields ?? userFieldsPlaceholder}
              />
            </>
          )}
          {!rundown && (
            <>
              <Input
                ref={fileInputRef}
                style={{ display: 'none' }}
                type='file'
                onChange={handleFile}
                accept='.json'
                data-testid='file-input'
              />
              <div>Need to add some help here</div>
              <div>
                <Button onClick={handleClick}>Upload Client Secrect</Button>
              </div>
              {authState && <div>You are authenticated</div>}
              {!authState && <div>You are not authenticated</div>}
              <div>
                <label htmlFor='sheetid'>Sheet ID </label>
                <Input
                  type='text'
                  ref={sheetid}
                  id='sheetid'
                  width='440px'
                  size='sm'
                  textAlign='right'
                  variant='ontime-filled-on-light'
                />
                <br />
                <label htmlFor='worksheet'>Worksheet </label>
                <Input
                  type='text'
                  ref={worksheet}
                  id='worksheet'
                  width='240px'
                  size='sm'
                  textAlign='right'
                  variant='ontime-filled-on-light'
                />
              </div>
              <div>
                <Button variant='ontime-filled' padding='0 2em' onClick={handlePullData}>
                  Pull data
                </Button>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant='ontime-ghost-on-light'>Reset</Button>
          {!rundown && (
            <Button variant='ontime-filled' padding='0 2em' onClick={handleAuthenticate}>
              Authenticate
            </Button>
          )}
          {rundown && (
            <Button variant='ontime-filled' padding='0 2em' onClick={handleFinalise}>
              Import
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
