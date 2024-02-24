import { useRef, useState } from 'react';
import { Button, Input } from '@chakra-ui/react';
import { IoCloudOutline } from '@react-icons/all-files/io5/IoCloudOutline';
import { IoDownloadOutline } from '@react-icons/all-files/io5/IoDownloadOutline';

import * as Panel from '../PanelUtils';

import GSheetInfo from './GSheetInfo';
import GSheetSetup from './GSheetSetup';
import ImportMap from './ImportMap';
import ImportReview from './ImportReview';
import { useSheetStore } from './useSheetStore';

import style from './SourcesPanel.module.scss';

export default function SourcesPanel() {
  const [importFlow, setImportFlow] = useState<'none' | 'excel' | 'gsheet'>('none');

  const authenticationStatus = useSheetStore((state) => state.authenticationStatus);
  const rundown = useSheetStore((state) => state.rundown);
  const userFields = useSheetStore((state) => state.userFields);

  const isAuthenticated = authenticationStatus === 'authenticated';
  const hasData = rundown && userFields;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = () => console.error('not yet implemented');

  const handleUpload = () => {
    fileInputRef.current?.click();
    setImportFlow('excel');
  };

  const openGSheetFlow = () => {
    setImportFlow('gsheet');
  };

  const cancelGSheetFlow = () => {
    setImportFlow('none');
  };

  const isExcelFlow = importFlow === 'excel';
  const isGSheetFlow = importFlow === 'gsheet';

  return (
    <>
      <Panel.Header>Data sources</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>Synchronise your rundown with an external source</Panel.SubHeader>
          <GSheetInfo />
          {!isGSheetFlow && (
            <>
              <Input ref={fileInputRef} style={{ display: 'none' }} type='file' onChange={handleFile} accept='.xlsx' />
              <div className={style.uploadSection}>
                <div>
                  <Button
                    variant='ontime-filled'
                    size='sm'
                    leftIcon={<IoDownloadOutline />}
                    onClick={handleUpload}
                    isDisabled
                  >
                    Import from spreadsheet
                  </Button>
                  <Panel.Description>Accepts .xlsx files</Panel.Description>
                </div>
                <div>
                  <Button variant='ontime-filled' size='sm' leftIcon={<IoCloudOutline />} onClick={openGSheetFlow}>
                    Synchronise with Google
                  </Button>
                  <Panel.Description>Start authentication process</Panel.Description>
                </div>
              </div>
            </>
          )}
          {isGSheetFlow && <GSheetSetup onCancel={cancelGSheetFlow} />}
          {isExcelFlow && <Panel.Title>Not yet implemented</Panel.Title>}
          {isAuthenticated && <ImportMap />}
          {hasData && <ImportReview rundown={rundown} userFields={userFields} />}
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
