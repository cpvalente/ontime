import { useRef } from 'react';
import { Button, Input } from '@chakra-ui/react';
import { IoCheckmark } from '@react-icons/all-files/io5/IoCheckmark';
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

  const stepData = useSheetStore((state) => state.stepData);
  const reset = useSheetStore((state) => state.reset);

  const sheetIdInputRef = useRef<HTMLInputElement>(null);

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

  const canConnect = stepData.authenticate.available && sheetIdInputRef?.current?.value;

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
          <Input
            type='file'
            onChange={handleClientSecret}
            accept='.json'
            size='sm'
            variant='ontime-filled'
            maxWidth='400px'
          />
          <Button
            variant='ontime-subtle'
            size='sm'
            onClick={handleAuthenticate}
            leftIcon={<IoShieldCheckmarkOutline />}
            disabled={!stepData.authenticate.available}
          >
            Authenticate
          </Button>
        </div>
        <Panel.Error>{stepData.clientSecret.error}</Panel.Error>
      </Panel.ListGroup>

      <Panel.ListGroup>
        <Panel.Error>{stepData.sheetId.error}</Panel.Error>
        <div className={style.buttonRow}>
          <Input
            size='sm'
            variant='ontime-filled'
            autoComplete='off'
            isDisabled={!stepData.sheetId.available}
            placeholder='Enter Sheet ID'
            maxWidth='400px'
          />
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
    </Panel.Section>
  );
}
