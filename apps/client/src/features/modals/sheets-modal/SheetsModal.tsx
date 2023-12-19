import { ChangeEvent, useEffect, useRef, useState } from 'react';
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
  Select,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { OntimeRundown, ProjectData, UserFields } from 'ontime-types';

import { PROJECT_DATA, RUNDOWN, USERFIELDS } from '../../../common/api/apiConstants';
import { maybeAxiosError } from '../../../common/api/apiUtils';
import {
  getSheetsAuthUrl,
  patchData,
  postPreviewSheet,
  postPushSheet,
  uploadSheetClientFile,
} from '../../../common/api/ontimeApi';
import useSheetState from '../../../common/hooks-query/useSheetState';
import { projectDataPlaceholder } from '../../../common/models/ProjectData';
import { userFieldsPlaceholder } from '../../../common/models/UserFields';
import ModalLink from '../ModalLink';
import PreviewExcel from '../upload-modal/preview/PreviewExcel';

import Step from './Step';

interface SheetsModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function SheetsModal(props: SheetsModalProps) {
  const { isOpen, onClose } = props;

  const queryClient = useQueryClient();

  const [rundown, setRundown] = useState<OntimeRundown | null>(null);
  const [userFields, setUserFields] = useState<UserFields | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLInputElement>(null);
  const worksheetRef = useRef<HTMLSelectElement>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [worksheet, setWorksheet] = useState<string | null>(null);

  const { data: sheetState, refetch } = useSheetState(sheetId, worksheet);

  const onChange = () => {
    if (sheetRef.current?.value && sheetRef.current?.value.length > 43 && worksheetRef.current) {
      setSheetId(sheetRef.current.value);
      setWorksheet(worksheetRef.current.value);
      refetch();
    }
  };
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
    refetch();
  };

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
    return () => {
      // Alex: This function will be run when the component unmounts
      console.log('Component is unmounting');
    };
  }, [isOpen]);

  const handleAuthenticate = () => {
    getSheetsAuthUrl().then((data) => {
      if (data !== 'bad') {
        window.open(data, '_blank', 'noreferrer');
        //TODO: can we detect when this window is closed
      }
    });
  };

  const handlePullData = () => {
    postPreviewSheet(sheetRef.current?.value ?? '', worksheetRef.current?.value ?? '').then((data) => {
      setProject(data.project);
      setRundown(data.rundown);
      setUserFields(data.userFields);
    });
  };

  const handlePushData = () => {
    postPushSheet(sheetRef.current?.value ?? '', worksheetRef.current?.value ?? '');
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
        <ModalHeader>Rundown from sheets</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Alert status='info' variant='ontime-on-light-info'>
            <AlertIcon />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <AlertTitle>Sync with Google Sheets</AlertTitle>
              <AlertDescription>
                Add information here, maybe a link too. <br />
                The save button is also confusing, can we clarify? should the push data and pull data not be the end
                game buttons here?
                <ModalLink href='our-docs'>For more information, see the docs</ModalLink>
              </AlertDescription>
            </div>
          </Alert>
          {!rundown ? (
            <>
              <Step step={1} title='Upload token' completed={Boolean(sheetState?.secret)} disabled={false}>
                <Input
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  type='file'
                  onChange={handleFile}
                  accept='.json'
                  data-testid='file-input'
                />
                <Button size='sm' variant='ontime-ghosted-on-light' onClick={handleClick}>
                  Upload Client Secret
                </Button>
              </Step>

              <Step
                step={2}
                title='Authenticate with Google'
                completed={Boolean(sheetState?.auth)}
                disabled={!sheetState?.secret}
              >
                <Button
                  size='sm'
                  variant='ontime-ghosted-on-light'
                  onClick={handleAuthenticate}
                  disabled={!sheetState?.secret}
                >
                  Authenticate
                </Button>
              </Step>

              <Step step={3} title='Add Sheet ID' completed={Boolean(sheetState?.id)} disabled={!sheetState?.auth}>
                <label htmlFor='sheetid'>
                  Sheet ID
                  <Input
                    type='text'
                    ref={sheetRef}
                    id='sheetid'
                    size='sm'
                    onChange={onChange}
                    variant='ontime-filled-on-light'
                    disabled={!sheetState?.auth}
                  />
                </label>
              </Step>

              <Step
                step={4}
                title='Select Worksheet to import'
                completed={Boolean(sheetState?.worksheet)}
                disabled={!sheetState?.worksheetOptions}
              >
                <label htmlFor='worksheet'>
                  Worksheet
                  <Select ref={worksheetRef} size='sm' id='worksheet' disabled={!sheetState?.worksheetOptions}>
                    {sheetState?.worksheetOptions?.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </label>
              </Step>

              <Step step={5} title='Upload / Download rundown' completed={false} disabled={!sheetState?.worksheet}>
                <div style={{ display: 'flex', gap: '1em' }}>
                  <Button
                    disabled={!sheetState?.worksheet}
                    variant='ontime-ghosted-on-light'
                    padding='0 2em'
                    onClick={handlePullData}
                  >
                    Push data
                  </Button>
                  <Button
                    disabled={!sheetState?.worksheet}
                    variant='ontime-ghosted-on-light'
                    padding='0 2em'
                    onClick={handlePushData}
                  >
                    Pull data
                  </Button>
                </div>
              </Step>
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
          <Button variant='ontime-ghost-on-light'>Reset</Button>
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
