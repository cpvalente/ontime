import { ChangeEvent, useCallback, useRef, useState } from 'react';
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
  Progress,
  Switch,
} from '@chakra-ui/react';
import { IoClose } from '@react-icons/all-files/io5/IoClose';
import { IoDocumentTextOutline } from '@react-icons/all-files/io5/IoDocumentTextOutline';
import { IoWarningOutline } from '@react-icons/all-files/io5/IoWarningOutline';
import { useQueryClient } from '@tanstack/react-query';
import { OntimeRundown } from 'ontime-types';

import { RUNDOWN_TABLE } from '../../../common/api/apiConstants';
import { postPreviewExcel, uploadData } from '../../../common/api/ontimeApi';
import PreviewProjectData from '../../../common/components/import-preview/PreviewProjectData';
import PreviewRundown from '../../../common/components/import-preview/PreviewRundown';
import PreviewUserField from '../../../common/components/import-preview/PreviewUserFields';
import { projectDataPlaceholder } from '../../../common/models/ProjectData';
import { userFieldsPlaceholder } from '../../../common/models/UserFields';
import { useEmitLog } from '../../../common/stores/logger';
import ModalSplitInput from '../ModalSplitInput';

import { validateFile } from './utils';

import style from './UploadModal.module.scss';

const rundownDemo: OntimeRundown = [
  {
    title: 'Albania',
    subtitle: 'Sekret',
    presenter: 'Ronela Hajati',
    note: 'SF1.01',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 36000000,
    timeEnd: 37200000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: '32d31',
    cue: '1',
  },
  {
    title: 'Latvia',
    subtitle: 'Eat Your Salad',
    presenter: 'Citi Zeni',
    note: 'SF1.02',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 37500000,
    timeEnd: 38700000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: '21cd2',
    cue: '2',
  },
  {
    title: 'Lithuania',
    subtitle: 'Sentimentai',
    presenter: 'Monika Liu',
    note: 'SF1.03',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 39000000,
    timeEnd: 40200000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: '0b371',
    cue: '3',
  },
  {
    title: 'Switzerland',
    subtitle: 'Boys Do Cry',
    presenter: 'Marius Bear',
    note: 'SF1.04',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 40500000,
    timeEnd: 41700000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: '3cd28',
    cue: '4',
  },
  {
    title: 'Slovenia',
    subtitle: 'Disko',
    presenter: 'LPS',
    note: 'SF1.05',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 42000000,
    timeEnd: 43200000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: 'e457f',
    cue: '5',
  },
  {
    title: 'Lunch break',
    type: 'block',
    id: '01e85',
  },
  {
    title: 'Ukraine',
    subtitle: 'Stefania',
    presenter: 'Kalush Orchestra',
    note: 'SF1.06',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 47100000,
    timeEnd: 48300000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: '1c420',
    cue: '6',
  },
  {
    title: 'Bulgaria',
    subtitle: 'Intention',
    presenter: 'Intelligent Music Project',
    note: 'SF1.07',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 48600000,
    timeEnd: 49800000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: 'b7737',
    cue: '7',
  },
  {
    title: 'Netherlands',
    subtitle: 'De Diepte',
    presenter: 'S10',
    note: 'SF1.08',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 50100000,
    timeEnd: 51300000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: 'd3a80',
    cue: '8',
  },
  {
    title: 'Moldova',
    subtitle: 'Trenuletul',
    presenter: 'Zdob si Zdub',
    note: 'SF1.09',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 51600000,
    timeEnd: 52800000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: '8276c',
    cue: '9',
  },
  {
    title: 'Portugal',
    subtitle: 'Saudade Saudade',
    presenter: 'Maro',
    note: 'SF1.10',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 53100000,
    timeEnd: 54300000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: '2340b',
    cue: '10',
  },
  {
    title: 'Afternoon break',
    type: 'block',
    id: 'cb90b',
  },
  {
    title: 'Croatia',
    subtitle: 'Guilty Pleasure',
    presenter: 'Mia Dimsic',
    note: 'SF1.11',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 56100000,
    timeEnd: 57300000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: '503c4',
    cue: '11',
  },
  {
    title: 'Denmark',
    subtitle: 'The Show',
    presenter: 'Reddi',
    note: 'SF1.12',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 57600000,
    timeEnd: 58800000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: '5e965',
    cue: '12',
  },
  {
    title: 'Austria',
    subtitle: 'Halo',
    presenter: 'LUM!X & Pia Maria',
    note: 'SF1.13',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 59100000,
    timeEnd: 60300000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: 'bab4a',
    cue: '13',
  },
  {
    title: 'Greece',
    subtitle: 'Die Together',
    presenter: 'Amanda Tenfjord',
    note: 'SF1.14',
    endAction: 'none',
    timerType: 'count-down',
    timeStart: 60600000,
    timeEnd: 61800000,
    duration: 1200000,
    isPublic: true,
    skip: false,
    colour: '',
    user0: '',
    user1: '',
    user2: '',
    user3: '',
    user4: '',
    user5: '',
    user6: '',
    user7: '',
    user8: '',
    user9: '',
    type: 'event',
    revision: 0,
    id: 'd3eb1',
    cue: '14',
  },
];

interface UploadModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export default function UploadModal({ onClose, isOpen }: UploadModalProps) {
  const queryClient = useQueryClient();
  const { emitError } = useEmitLog();
  const [errors, setErrors] = useState<string | undefined>();
  const [isSubmitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const overrideOptionRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState(false);

  const handleFile = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const fileUploaded = event?.target?.files?.[0];
    if (!fileUploaded) return;

    const validate = validateFile(fileUploaded);
    setErrors(validate.errors?.[0]);

    if (validate.isValid) {
      setFile(fileUploaded);
    } else {
      setFile(null);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    console.log(file);
    if (file) {
      // not the most robust, but ok for now
      if (file.name.endsWith('.xlsx')) {
        console.log('pushing to preview');
        const r = await postPreviewExcel(file, setProgress, {});
        console.log('got from preview', r);
      } else {
        try {
          const options = {
            onlyRundown: overrideOptionRef.current?.checked || false,
          };
          await uploadData(file, setProgress, options);
        } catch (error) {
          emitError(`Failed uploading file: ${error}`);
        } finally {
          await queryClient.invalidateQueries(RUNDOWN_TABLE);
          setSuccess(true);
        }
      }
    }
    setSubmitting(false);
  }, [emitError, file, queryClient]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setFile(null);
  };

  const handleClose = () => {
    clearFile();
    setSuccess(false);
    setErrors(undefined);
    setProgress(0);
    onClose();
  };

  const disableSubmit = !file || isSubmitting;

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen}
      closeOnOverlayClick={false}
      motionPreset='slideInBottom'
      size='xl'
      scrollBehavior='inside'
      preserveScrollBarGap
      variant='ontime-small'
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>File import</ModalHeader>
        <ModalCloseButton />
        <ModalBody className={style.uploadBody}>
          <Input
            ref={fileInputRef}
            style={{ display: 'none' }}
            type='file'
            onChange={handleFile}
            accept='.json, .xlsx'
            data-testid='file-input'
          />
          <div className={style.uploadArea} onClick={handleClick}>
            Click to upload Ontime project file
          </div>
          {file && (
            <div className={`${style.uploadedItem} ${success ? style.success : ''}`}>
              <IoClose className={style.cancelUpload} onClick={clearFile} />
              <IoDocumentTextOutline className={style.icon} />
              <span className={style.fileTitle}>{file.name}</span>
              <span className={style.fileInfo}>{`${(file.size / 1024).toFixed(2)}kb - ${file.type}`}</span>
              <Progress variant='ontime-on-light' className={style.fileProgress} value={progress} />
            </div>
          )}
          {errors && (
            <div className={`${style.uploadedItem} ${style.error}`}>
              <IoWarningOutline className={style.icon} />
              <span className={style.fileTitle}>{errors}</span>
              <span className={style.fileInfo}>Please try again</span>
              <Progress className={style.fileProgress} value={progress} />
            </div>
          )}
          <div className={style.uploadOptions}>
            <span className={style.title}>Import options</span>
            <ModalSplitInput
              field=''
              title='Only import rundown'
              description='All other options, including application settings will be discarded'
            >
              <Switch variant='ontime-on-light' ref={overrideOptionRef} />
            </ModalSplitInput>
          </div>
          <PreviewProjectData project={projectDataPlaceholder} />
          <PreviewUserField userFields={userFieldsPlaceholder} />
          <PreviewRundown rundown={rundownDemo} />
        </ModalBody>
        <ModalFooter className={`${style.buttonSection} ${style.pad}`}>
          <Button onClick={handleClose} isDisabled={isSubmitting} variant='ontime-ghost-on-light' size='sm'>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={disableSubmit}
            variant='ontime-filled'
            padding='0 2em'
            size='sm'
          >
            Import
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
