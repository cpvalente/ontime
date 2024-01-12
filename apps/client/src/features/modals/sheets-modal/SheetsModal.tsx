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
import { defaultExcelImportMap, ExcelImportMap } from 'ontime-utils';

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
import ExcelFileOptions from '../upload-modal/upload-options/ExcelFileOptions';

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
  const [worksheetOptions, setWorksheetOptions] = useState<string[]>([]);

  const [direction, setDirection] = useState('none');
  const excelFileOptions = useRef<ExcelImportMap>(defaultExcelImportMap);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState({
    clientSecret: { complete: false, message: '' },
    authenticate: { complete: false, message: '' },
    id: { complete: false, message: '' },
    worksheet: { complete: false, message: '' },
    pullPush: { complete: false, message: '' },
  });

  useEffect(() => {
    if (isOpen) {
      setDirection('none');
      testClientSecret();
      if (state.clientSecret.complete) testAuthentication();
      if (state.authenticate.complete) testSheetId();
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
        clientSecret: { complete: false, message: 'Missing file' },
        authenticate: { complete: false, message: '' },
        id: { complete: false, message: '' },
        worksheet: { complete: false, message: '' },
        pullPush: { complete: false, message: '' },
      });
      return;
    }
    const selectedFile = event.target.files[0];
    uploadSheetClientFile(selectedFile)
      .then(() => {
        setState({ ...state, clientSecret: { complete: true, message: '' } });
      })
      .catch((err) => {
        const message = maybeAxiosError(err);
        setState({
          clientSecret: { complete: false, message },
          authenticate: { complete: false, message: '' },
          id: { complete: false, message: '' },
          worksheet: { complete: false, message: '' },
          pullPush: { complete: false, message: '' },
        });
      });
  };

  const testClientSecret = () => {
    getClientSecrect()
      .then(() => {
        setState({ ...state, clientSecret: { complete: true, message: '' } });
      })
      .catch((err) => {
        const message = maybeAxiosError(err);
        setState({
          clientSecret: { complete: false, message },
          authenticate: { complete: false, message: '' },
          id: { complete: false, message: '' },
          worksheet: { complete: false, message: '' },
          pullPush: { complete: false, message: '' },
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
          authenticate: { complete: false, message },
          id: { complete: false, message: '' },
          worksheet: { complete: false, message: '' },
          pullPush: { complete: false, message: '' },
        });
      });
  };

  const testAuthentication = () => {
    getAuthentication()
      .then(() => {
        setState({ ...state, authenticate: { complete: true, message: '' } });
      })
      .catch((error) => {
        const message = maybeAxiosError(error);
        setState({
          ...state,
          authenticate: { complete: false, message },
          id: { complete: false, message: '' },
          worksheet: { complete: false, message: '' },
          pullPush: { complete: false, message: '' },
        });
      });
  };

  //SETP-3 set sheet ID
  const testSheetId = () => {
    postId(id)
      .then((data) => {
        setState({ ...state, id: { complete: true, message: '' } });
        setWorksheetOptions(data.worksheetOptions);
      })
      .catch((err) => {
        const message = maybeAxiosError(err);
        setState({
          ...state,
          id: { complete: false, message },
          worksheet: { complete: false, message: '' },
          pullPush: { complete: false, message: '' },
        });
        setWorksheetOptions([]);
      });
  };

  //SETP-4 Select Worksheet
  const testWorksheet = (value: string) => {
    excelFileOptions.current.worksheet = value;
    setWorksheet(value);
    postWorksheet(id, worksheet)
      .then(() => {
        setState({ ...state, worksheet: { complete: true, message: '' } });
      })
      .catch((err) => {
        const message = maybeAxiosError(err);
        setState({ ...state, worksheet: { complete: false, message }, pullPush: { complete: false, message: '' } });
      });
  };

  //SETP-5 Upload / Download
  const updateExcelFileOptions = <T extends keyof ExcelImportMap>(field: T, value: ExcelImportMap[T]) => {
    if (excelFileOptions.current[field] !== value) {
      excelFileOptions.current = { ...excelFileOptions.current, [field]: value };
    }
  };

  const handlePullData = () => {
    postPreviewSheet(id, excelFileOptions.current)
      .then((data) => {
        setProject(data.project);
        setRundown(data.rundown);
        setUserFields(data.userFields);
      })
      .catch((error) => {
        const message = maybeAxiosError(error);
        setDirection('none');
        setState({ ...state, pullPush: { complete: false, message } });
      });
  };

  const handlePushData = () => {
    postPushSheet(id, excelFileOptions.current)
      .then(() => {
        setDirection('none');
        setState({ ...state, pullPush: { complete: true, message: '' } });
      })
      .catch((error) => {
        const message = maybeAxiosError(error);
        setDirection('none');
        setState({ ...state, pullPush: { complete: false, message } });
      });
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
        <ModalHeader>Rundown from sheets (experimental)</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Alert status='info' variant='ontime-on-light-info'>
            <AlertIcon />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <AlertTitle>Sync with Google Sheets</AlertTitle>
              <AlertDescription>
                <ModalLink href='https://ontime.gitbook.io/v2/features/google-sheet'>
                  For more information, see the docs
                </ModalLink>
              </AlertDescription>
            </div>
          </Alert>
          {!rundown ? (
            direction === 'up' || direction === 'down' ? (
              <ExcelFileOptions optionsRef={excelFileOptions} updateOptions={updateExcelFileOptions} />
            ) : (
              <>
                <Step
                  title='1 - Upload OAuth 2.0 Client ID'
                  completed={state.clientSecret.complete}
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
                      {state.clientSecret.complete ? 'Reupload Client ID' : 'Upload Client ID'}
                    </Button>
                    <Button size='sm' variant='ontime-ghosted-on-light' onClick={testClientSecret}>
                      Retry Client ID
                    </Button>
                  </div>
                </Step>

                <Step
                  title='2 - Authenticate with Google'
                  completed={state.authenticate.complete}
                  disabled={!state.clientSecret.complete}
                  error={state.authenticate.message}
                >
                  <div style={{ display: 'flex', gap: '1em' }}>
                    <Button
                      size='sm'
                      variant='ontime-subtle-on-light'
                      onClick={handleAuthenticate}
                      isDisabled={!state.clientSecret.complete}
                    >
                      Authenticate
                    </Button>
                    <Button
                      size='sm'
                      variant='ontime-ghosted-on-light'
                      onClick={testAuthentication}
                      isDisabled={!state.clientSecret.complete}
                    >
                      Retry Connection
                    </Button>
                  </div>
                </Step>

                <Step
                  title='3 - Add Document ID'
                  completed={state.id.complete}
                  disabled={!state.authenticate.complete}
                  error={state.id.message}
                >
                  <HStack>
                    <Input
                      type='text'
                      size='sm'
                      variant='ontime-filled-on-light'
                      isDisabled={!state.authenticate.complete}
                      value={id}
                      onChange={(event) => setSheetId(event.target.value)}
                    />
                    <Button
                      isDisabled={!state.authenticate.complete}
                      size='sm'
                      variant='ontime-subtle-on-light'
                      padding='0 2em'
                      onClick={testSheetId}
                    >
                      Connect
                    </Button>
                  </HStack>
                </Step>

                <Step
                  title='4 - Select Worksheet to import'
                  completed={state.worksheet.complete}
                  disabled={worksheetOptions.length == 0}
                >
                  <Select
                    size='sm'
                    isDisabled={worksheetOptions.length == 0}
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

                <Step title='5 - Upload / Download rundown' completed={false} disabled={!state.worksheet.complete}>
                  <div style={{ display: 'flex', gap: '1em' }}>
                    <Button
                      isDisabled={!state.worksheet.complete}
                      variant='ontime-subtle-on-light'
                      padding='0 2em'
                      onClick={() => setDirection('up')}
                    >
                      Upload
                    </Button>
                    <Button
                      isDisabled={!state.worksheet.complete}
                      variant='ontime-subtle-on-light'
                      padding='0 2em'
                      onClick={() => setDirection('down')}
                    >
                      Download
                    </Button>
                  </div>
                </Step>
              </>
            )
          ) : (
            <PreviewExcel
              rundown={rundown ?? []}
              project={project ?? projectDataPlaceholder}
              userFields={userFields ?? userFieldsPlaceholder}
            />
          )}
        </ModalBody>
        <ModalFooter>
          {rundown ? (
            <div style={{ display: 'flex', gap: '1em' }}>
              <Button
                onClick={() => {
                  setRundown(null);
                  setDirection('none');
                }}
                variant='ontime-ghost-on-light'
              >
                Go Back
              </Button>
              <Button variant='ontime-filled' padding='0 2em' onClick={handleFinalise}>
                Import
              </Button>
            </div>
          ) : direction === 'up' ? (
            <div style={{ display: 'flex', gap: '1em' }}>
              <Button onClick={() => setDirection('none')} variant='ontime-ghost-on-light'>
                Go Back
              </Button>
              <Button variant='ontime-filled' padding='0 2em' onClick={handlePushData}>
                Upload
              </Button>
            </div>
          ) : direction === 'down' ? (
            <div style={{ display: 'flex', gap: '1em' }}>
              <Button onClick={() => setDirection('none')} variant='ontime-ghost-on-light'>
                Go Back
              </Button>
              <Button variant='ontime-filled' padding='0 2em' onClick={handlePullData}>
                Preview
              </Button>
            </div>
          ) : (
            <></>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
