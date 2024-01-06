import { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  HStack,
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
  getAuthentication,
  getClientSecrect,
  getSheetsAuthUrl,
  patchData,
  postId,
  postPreviewSheet,
  postPushSheet,
  postWorksheet,
  uploadSheetClientFile,
} from '../../../common/api/ontimeApi';
import { projectDataPlaceholder } from '../../../common/models/ProjectData';
import { userFieldsPlaceholder } from '../../../common/models/UserFields';
import { openLink } from '../../../common/utils/linkUtils';
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

  const [id, setSheetId] = useState('');
  const [worksheet, setWorksheet] = useState('');
  const [worksheetOptions, setWorksheetOptions] = useState(new Array<string>());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState({
    clientSecret: { complet: false, message: '' },
    authenticate: { complet: false, message: '' },
    id: { complet: false, message: '' },
    worksheet: { complet: false, message: '' },
    pullPush: { complet: false, message: '' },
  });

  useEffect(() => {
    if (isOpen) {
      testClientSecrect();
      if (state.clientSecret.complet) testAuthentication();
      if (state.authenticate.complet) testSheetId();
    }
  }, [isOpen]);

  const handleClose = () => {
    setRundown(null);
    setProject(null);
    setUserFields(null);
    onClose();
  };

  //SETP-1 Upload Client ID
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      setState({
        clientSecret: { complet: false, message: 'Missing file' },
        authenticate: { complet: false, message: '' },
        id: { complet: false, message: '' },
        worksheet: { complet: false, message: '' },
        pullPush: { complet: false, message: '' },
      });
      return;
    }
    const selectedFile = event.target.files[0];
    uploadSheetClientFile(selectedFile)
      .then(() => {
        setState({ ...state, clientSecret: { complet: true, message: '' } });
      })
      .catch((err) => {
        const message = maybeAxiosError(err);
        setState({
          clientSecret: { complet: false, message },
          authenticate: { complet: false, message: '' },
          id: { complet: false, message: '' },
          worksheet: { complet: false, message: '' },
          pullPush: { complet: false, message: '' },
        });
      });
  };

  const testClientSecrect = () => {
    getClientSecrect()
      .then(() => {
        setState({ ...state, clientSecret: { complet: true, message: '' } });
      })
      .catch((err) => {
        const message = maybeAxiosError(err);
        setState({
          clientSecret: { complet: false, message },
          authenticate: { complet: false, message: '' },
          id: { complet: false, message: '' },
          worksheet: { complet: false, message: '' },
          pullPush: { complet: false, message: '' },
        });
      });
  };

  //SETP-2 Authenticate
  const handleAuthenticate = () => {
    getSheetsAuthUrl()
      .then((data) => {
        openLink(data);
        window.addEventListener('focus', () => testAuthentication(), { once: true });
      })
      .catch((err) => {
        const message = maybeAxiosError(err);
        setState({
          ...state,
          authenticate: { complet: false, message },
          id: { complet: false, message: '' },
          worksheet: { complet: false, message: '' },
          pullPush: { complet: false, message: '' },
        });
      });
  };

  const testAuthentication = () => {
    getAuthentication()
      .then(() => {
        setState({ ...state, authenticate: { complet: true, message: '' } });
      })
      .catch((error) => {
        const message = maybeAxiosError(error);
        setState({
          ...state,
          authenticate: { complet: false, message },
          id: { complet: false, message: '' },
          worksheet: { complet: false, message: '' },
          pullPush: { complet: false, message: '' },
        });
      });
  };

  //SETP-3 set sheet ID
  const testSheetId = () => {
    postId(id)
      .then((data) => {
        setState({ ...state, id: { complet: true, message: '' } });
        setWorksheetOptions(data.worksheetOptions);
      })
      .catch((err) => {
        const message = maybeAxiosError(err);
        setState({
          ...state,
          id: { complet: false, message },
          worksheet: { complet: false, message: '' },
          pullPush: { complet: false, message: '' },
        });
        setWorksheetOptions([]);
      });
  };

  //SETP-4 Select Worksheet
  const testWorksheet = (value: string) => {
    setWorksheet(value);
    postWorksheet(id, worksheet)
      .then(() => {
        setState({ ...state, worksheet: { complet: true, message: '' } });
      })
      .catch((err) => {
        const message = maybeAxiosError(err);
        setState({ ...state, worksheet: { complet: false, message }, pullPush: { complet: false, message: '' } });
      });
  };

  //SETP-5 Upload / Download
  const handlePullData = () => {
    postPreviewSheet(id, worksheet).then((data) => {
      setProject(data.project);
      setRundown(data.rundown);
      setUserFields(data.userFields);
    });
  };

  const handlePushData = () => {
    postPushSheet(id, worksheet);
  };

  //GET preview
  const handleFinalise = async () => {
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
        console.error(message);
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
                <ModalLink href='our-docs'>For more information, see the docs</ModalLink>
              </AlertDescription>
            </div>
          </Alert>
          {!rundown ? (
            <>
              <Step
                title='1 - Upload OAuth 2.0 Client ID'
                completed={state.clientSecret.complet}
                disabled={false}
                error={state.clientSecret.message}
              >
                <Input
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  type='file'
                  onChange={handleFile}
                  accept='.json'
                  data-testid='file-input'
                />
                <div style={{ display: 'flex', gap: '1em' }}>
                  <Button size='sm' variant='ontime-subtle-on-light' onClick={handleClick}>
                    {state.clientSecret.complet ? 'Reupload Client ID' : 'Upload Client ID'}
                  </Button>
                  <Button size='sm' variant='ontime-ghosted-on-light' onClick={testClientSecrect}>
                    Retry Client ID
                  </Button>
                </div>
              </Step>

              <Step
                title='2 - Authenticate with Google'
                completed={state.authenticate.complet}
                disabled={!state.clientSecret.complet}
                error={state.authenticate.message}
              >
                <div style={{ display: 'flex', gap: '1em' }}>
                  <Button
                    size='sm'
                    variant='ontime-subtle-on-light'
                    onClick={handleAuthenticate}
                    isDisabled={!state.clientSecret.complet}
                  >
                    Authenticate
                  </Button>
                  <Button
                    size='sm'
                    variant='ontime-ghosted-on-light'
                    onClick={testAuthentication}
                    isDisabled={!state.clientSecret.complet}
                  >
                    Retry Connection
                  </Button>
                </div>
              </Step>

              <Step
                title='3 - Add Document ID'
                completed={state.id.complet}
                disabled={!state.authenticate.complet}
                error={state.id.message}
              >
                <HStack>
                  <Input
                    type='text'
                    size='sm'
                    variant='ontime-filled-on-light'
                    disabled={!state.authenticate.complet}
                    value={id}
                    onChange={(event) => setSheetId(event.target.value)}
                  />
                  <Button size='sm' variant='ontime-subtle-on-light' padding='0 2em' onClick={testSheetId}>
                    Connect
                  </Button>
                </HStack>
              </Step>

              <Step
                title='4 - Select Worksheet to import'
                completed={state.worksheet.complet}
                disabled={worksheetOptions.length == 0}
              >
                <Select
                  size='sm'
                  disabled={worksheetOptions.length == 0}
                  placeholder='Select a worksheet'
                  onChange={(event) => testWorksheet(event.target.value)}
                  value={worksheet}
                >
                  {worksheetOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </Step>

              <Step title='5 - Upload / Download rundown' completed={false} disabled={!state.worksheet.complet}>
                <div style={{ display: 'flex', gap: '1em' }}>
                  <Button
                    disabled={!state.worksheet.complet}
                    variant='ontime-subtle-on-light'
                    padding='0 2em'
                    onClick={handlePushData}
                  >
                    Upload
                  </Button>
                  <Button
                    disabled={!state.worksheet.complet}
                    variant='ontime-subtle-on-light'
                    padding='0 2em'
                    onClick={handlePullData}
                  >
                    Download
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
