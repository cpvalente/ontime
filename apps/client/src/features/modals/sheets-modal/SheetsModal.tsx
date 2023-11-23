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
import { IoCheckmarkCircleOutline } from '@react-icons/all-files/io5/IoCheckmarkCircleOutline';
import { IoCloseCircleOutline } from '@react-icons/all-files/io5/IoCloseCircleOutline';

import { useQueryClient } from '@tanstack/react-query';
import { OntimeRundown, ProjectData, UserFields, GoogleSheetState } from 'ontime-types';

import { PROJECT_DATA, RUNDOWN, USERFIELDS } from '../../../common/api/apiConstants';
import { maybeAxiosError } from '../../../common/api/apiUtils';
import {
  getSheetsAuthUrl,
  patchData,
  postPreviewSheet,
  postPushSheet,
  uploadSheetClientFile,
  getSheetSettings,
  postSheetSettings,
  getSheetstate,
} from '../../../common/api/ontimeApi';
import { projectDataPlaceholder } from '../../../common/models/ProjectData';
import { userFieldsPlaceholder } from '../../../common/models/UserFields';
import PreviewExcel from '../upload-modal/preview/PreviewExcel';

interface SheetsModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function SheetsModal(props: SheetsModalProps) {
  const { isOpen, onClose } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rundown, setRundown] = useState<OntimeRundown | null>(null);
  const [userFields, setUserFields] = useState<UserFields | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);

  const [sheetState, setSheetState] = useState<GoogleSheetState>({ auth: false, id: false, worksheet: false });

  const queryClient = useQueryClient();

  const sheetid = useRef<HTMLInputElement>(null);
  const worksheet = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setRundown(null);
    setProject(null);
    setUserFields(null);
    // setSheetState({ auth: false, id: false, worksheet: false });
    onClose();
  };
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event?.target?.files?.[0];
    if (!selectedFile) {
      return;
    } else {
      uploadSheetClientFile(selectedFile);
    }
  };

  const _onChange = async () => {
    setSheetState(await getSheetstate());
  };

  if (isOpen) {
    //TODO: how to get this on modal open
    getSheetSettings().then((data) => {
      if (sheetid.current?.value != data.id || worksheet.current?.value != data.worksheet) {
        _onChange();
      }
      if (sheetid.current) {
        sheetid.current.value = data.id;
      }
      if (worksheet.current) {
        worksheet.current.value = data.worksheet;
      }
    });
  }

  const handelSave = () => {
    postSheetSettings({ id: sheetid.current?.value ?? '', worksheet: worksheet.current?.value ?? '' }).then((data) => {
      _onChange();
      if (sheetid.current) {
        sheetid.current.value = data.id;
      }
      if (worksheet.current) {
        worksheet.current.value = data.worksheet;
      }
    });
  };

  const handleAuthenticate = () => {
    getSheetsAuthUrl().then((data) => {
      if (data != 'bad') {
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

  const handlePushData = () => {
    postPushSheet(sheetid.current?.value ?? '', worksheet.current?.value ?? '').then((data) => {
      console.log(data);
    });
  };

  const handleFinalise = async () => {
    // this step is currently only used for excel files, after preview
    if (rundown && userFields && project) {
      let doClose = false;
      try {
        await patchData({ rundown, userFields, project });
        queryClient.setQueryData(RUNDOWN, rundown);
        queryClient.setQueryData(USERFIELDS, userFields);
        queryClient.setQueryData(PROJECT_DATA, project);
        await queryClient.invalidateQueries({
          queryKey: [...RUNDOWN, ...USERFIELDS, ...PROJECT_DATA],
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
              <Button variant='ontime-filled' padding='0 2em' onClick={handleAuthenticate}>
                Authenticate
              </Button>
              {sheetState.auth ? <div>You are authenticated</div> : <div>You are not authenticated</div>}
              <div>
                <label htmlFor='sheetid'>Sheet ID </label>
                <Input
                  type='text'
                  ref={sheetid}
                  id='sheetid'
                  width='240px'
                  size='sm'
                  textAlign='right'
                  variant='ontime-filled-on-light'
                />
                {sheetState.id ? <IoCheckmarkCircleOutline /> : <IoCloseCircleOutline />}
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
                {sheetState.worksheet ? <IoCheckmarkCircleOutline /> : <IoCloseCircleOutline />}
              </div>
              <div>
                <Button variant='ontime-filled' padding='0 2em' onClick={handlePullData}>
                  Pull data
                </Button>
                <Button variant='ontime-filled' padding='0 2em' onClick={handlePushData}>
                  Push data
                </Button>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant='ontime-ghost-on-light'>Reset</Button>
          {!rundown && (
            <Button variant='ontime-filled' padding='0 2em' onClick={handelSave}>
              Save
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
