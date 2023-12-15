import { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  Button,
  Input,
  InputGroup,
  InputRightAddon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
} from '@chakra-ui/react';
import { IoArrowDownCircleOutline } from '@react-icons/all-files/io5/IoArrowDownCircleOutline';
import { IoArrowUpCircleOutline } from '@react-icons/all-files/io5/IoArrowUpCircleOutline';
import { IoCheckmarkCircleOutline } from '@react-icons/all-files/io5/IoCheckmarkCircleOutline';
import { IoCloseCircleOutline } from '@react-icons/all-files/io5/IoCloseCircleOutline';
import { useQueryClient } from '@tanstack/react-query';
import { OntimeRundown, ProjectData, UserFields } from 'ontime-types';

import { PROJECT_DATA, RUNDOWN, USERFIELDS } from '../../../common/api/apiConstants';
import { maybeAxiosError } from '../../../common/api/apiUtils';
import {
  getSheetsAuthUrl,
  patchData,
  postPreviewSheet,
  postPushSheet,
  postSheetSettings,
  uploadSheetClientFile,
} from '../../../common/api/ontimeApi';
import useSheet from '../../../common/hooks-query/useSheet';
import useSheetState from '../../../common/hooks-query/useSheetState';
import { projectDataPlaceholder } from '../../../common/models/ProjectData';
import { userFieldsPlaceholder } from '../../../common/models/UserFields';
import PreviewExcel from '../upload-modal/preview/PreviewExcel';

interface SheetsModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function SheetsModal(props: SheetsModalProps) {
  const { isOpen, onClose } = props;

  const queryClient = useQueryClient();
  const { data } = useSheet();
  const { data: sheetState, refetch } = useSheetState();

  const [rundown, setRundown] = useState<OntimeRundown | null>(null);
  const [userFields, setUserFields] = useState<UserFields | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetid = useRef<HTMLInputElement>(null);
  const worksheet = useRef<HTMLSelectElement>(null);

  const handleClose = () => {
    setRundown(null);
    setProject(null);
    setUserFields(null);
    onClose();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }

    const selectedFile = event.target.files[0];
    try {
      await uploadSheetClientFile(selectedFile);
    } catch (error) {
      // TODO: show this in the modal
      console.error(error);
    }
    _onChange();
  };

  const _onChange = () => refetch();

  useEffect(() => {
    if (!data) {
      return;
    }

    const selectedSheetIdChanged = sheetid.current?.value !== data.id;
    const selectedWorksheetChanged = worksheet.current?.value !== data.worksheet && worksheet.current?.value;
    if (selectedSheetIdChanged || selectedWorksheetChanged) {
      _onChange();
      if (sheetid.current) {
        sheetid.current.value = data.id;
      }
      if (worksheet.current) {
        worksheet.current.value = data.worksheet;
      }
    }
  }, [data]);

  useEffect(() => {
    return () => {
      // Alex: This function will be run when the component unmounts
      console.log('Component is unmounting');
    };
  }, []);

  const handleSave = () => {
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
      if (data !== 'bad') {
        window.open(data, '_blank', 'noreferrer');
        //TODO: can we detect when this window is closed
      }
    });
  };

  const handlePullData = () => {
    postPreviewSheet().then((data) => {
      setProject(data.project);
      setRundown(data.rundown);
      setUserFields(data.userFields);
    });
  };

  const handlePushData = () => {
    postPushSheet();
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
            <PreviewExcel
              rundown={rundown ?? []}
              project={project ?? projectDataPlaceholder}
              userFields={userFields ?? userFieldsPlaceholder}
            />
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
              <div>
                <Button onClick={handleClick}>Upload Client Secret</Button>
                {sheetState?.secret ? 'have good secret' : 'no or bad secret'}
              </div>
              <div style={sheetState?.secret ? {} : { display: 'none' }}>
                <Button variant='ontime-filled' padding='0 2em' onClick={handleAuthenticate}>
                  Authenticate
                </Button>
                {sheetState?.auth ? 'You are authenticated' : 'You are not authenticated'}
              </div>
              <div style={sheetState?.auth ? {} : { display: 'none' }}>
                <label htmlFor='sheetid'>Sheet ID</label>
                <InputGroup size='sm'>
                  <Input
                    type='text'
                    ref={sheetid}
                    id='sheetid'
                    width='240px'
                    textAlign='right'
                    variant='ontime-filled-on-light'
                  />
                  <InputRightAddon>
                    {sheetState?.id ? <IoCheckmarkCircleOutline color='green' /> : <IoCloseCircleOutline color='red' />}
                  </InputRightAddon>
                </InputGroup>
              </div>
              <div style={sheetState?.id ? {} : { display: 'none' }}>
                <label htmlFor='worksheet'>Worksheet </label>
                <Select ref={worksheet} size='sm' id='worksheet'>
                  {sheetState?.worksheetOptions?.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>
              <br />
              <div style={sheetState?.worksheet ? {} : { display: 'none' }}>
                <Button
                  disabled={!sheetState?.worksheet}
                  variant='ontime-subtle-on-light'
                  padding='0 2em'
                  onClick={handlePullData}
                  rightIcon={<IoArrowDownCircleOutline />}
                >
                  Pull Rundown
                </Button>
                <Button
                  disabled={!sheetState?.worksheet}
                  variant='ontime-subtle-on-light'
                  padding='0 2em'
                  onClick={handlePushData}
                  rightIcon={<IoArrowUpCircleOutline />}
                >
                  Push Rundown
                </Button>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant='ontime-ghost-on-light'>Reset</Button>
          {!rundown && (
            <Button variant='ontime-filled' padding='0 2em' onClick={handleSave}>
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
