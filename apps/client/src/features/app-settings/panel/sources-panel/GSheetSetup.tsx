import { useRef } from 'react';
import { Button, Input, Select } from '@chakra-ui/react';
import { IoCheckmark } from '@react-icons/all-files/io5/IoCheckmark';
import { IoCloudDownloadOutline } from '@react-icons/all-files/io5/IoCloudDownloadOutline';
import { IoShieldCheckmarkOutline } from '@react-icons/all-files/io5/IoShieldCheckmarkOutline';

import * as Panel from '../PanelUtils';

import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

import style from './SourcesPanel.module.scss';

interface GSheetSetupProps {
  cancel: () => void;
}

export default function GSheetSetup({ cancel }: GSheetSetupProps) {
  const { handleClientSecret, handleAuthenticate, handleConnect } = useGoogleSheet();

  const sheetIdInputRef = useRef<HTMLInputElement>(null);

  const stepData = useSheetStore((state) => state.stepData);
  const reset = useSheetStore((state) => state.reset);

  const sheetId = useSheetStore((state) => state.sheetId);
  const worksheetOptions = useSheetStore((state) => state.worksheetOptions) ?? [];

  const setWorksheet = useSheetStore((state) => state.setWorksheet);
  const setSheetId = useSheetStore((state) => state.setSheetId);

  const worksheetIdInputRef = useRef<HTMLSelectElement>(null);

  // user cancels the flow
  const onCancel = () => {
    reset();
    cancel();
  };

  // connect to the accoutn with the given sheet ID
  const connectToId = () => {
    const sheetId = sheetIdInputRef.current?.value;
    if (!sheetId) return;

    handleConnect(sheetId);
  };

  // adds the user input sheet ID to the store
  const addSheetId = () => {
    const sheetId = sheetIdInputRef.current?.value;
    console.log('adding', sheetId);
    if (!sheetId) return;
    setSheetId(sheetId);
  };

  // adds the selected worksheet to the store
  const addWorksheetSheetId = () => {
    const worksheetId = worksheetIdInputRef.current?.value;
    if (!worksheetId) return;
    setWorksheet(worksheetId);
  };

  const canAuthenticate = stepData.authenticate.available;
  const canConnect = stepData.authenticate.available && sheetId;

  return (
    <Panel.Section>
      <Panel.Title>
        Sync with Google Sheet (experimental)
        <Button variant='ontime-subtle' size='sm' onClick={onCancel}>
          Cancel
        </Button>
      </Panel.Title>
      <Panel.ListGroup>
        <div className={style.buttonRow}>
          <div className={style.inputContainer}>
            <Input type='file' onChange={handleClientSecret} accept='.json' size='sm' variant='ontime-filled' />
          </div>
          <Button
            variant='ontime-subtle'
            size='sm'
            onClick={handleAuthenticate}
            leftIcon={<IoShieldCheckmarkOutline />}
            isDisabled={!canAuthenticate}
          >
            Authenticate
          </Button>
        </div>
        <Panel.Error>{stepData.clientSecret.error}</Panel.Error>
      </Panel.ListGroup>

      <Panel.ListGroup>
        <Panel.Error>{stepData.sheetId.error}</Panel.Error>
        <div className={style.buttonRow}>
          <div className={style.inputContainer}>
            <Input
              size='sm'
              variant='ontime-filled'
              autoComplete='off'
              isDisabled={!stepData.sheetId.available}
              placeholder='Enter Sheet ID'
              onBlur={addSheetId}
              onSubmit={addSheetId}
              ref={sheetIdInputRef}
            />
          </div>
          <Button
            variant='ontime-subtle'
            size='sm'
            onClick={connectToId}
            isDisabled={!canConnect}
            leftIcon={<IoCheckmark />}
          >
            Connect
          </Button>
        </div>
      </Panel.ListGroup>

      <Panel.ListGroup>
        <div className={style.buttonRow}>
          <div className={style.inputContainer}>
            <Select
              size='sm'
              variant='ontime'
              isDisabled={!stepData.worksheet.available}
              placeholder='Select worksheet'
              ref={worksheetIdInputRef}
            >
              {worksheetOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant='ontime-filled'
            size='sm'
            onClick={addWorksheetSheetId}
            isDisabled={!stepData.worksheet.available}
            leftIcon={<IoCloudDownloadOutline />}
          >
            Continue
          </Button>
        </div>
        <Panel.Error>{stepData.worksheet.error}</Panel.Error>
        <Panel.Error>{stepData.pullPush.error}</Panel.Error>
      </Panel.ListGroup>
    </Panel.Section>
  );
}
