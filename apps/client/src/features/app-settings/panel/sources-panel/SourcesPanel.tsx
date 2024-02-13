import { useRef } from 'react';
import { Alert, AlertDescription, AlertIcon, Button, Input, Select } from '@chakra-ui/react';

import ExternalLink from '../../../../common/components/external-link/ExternalLink';
import * as Panel from '../PanelUtils';

import useGoogleSheet from './useGoogleSheet';

import style from './SourcesPanel.module.scss';

const googleSheetDocsUrl = 'https://ontime.gitbook.io/v2/features/google-sheet';

export default function SourcesPanel() {
  const {
    stepData,
    handleFile,
    testClientSecret,
    handleAuthenticate,
    testAuthentication,
    testSheetId,
    testWorksheet,
    updateExcelFileOptions,
    handlePullData,
    handlePushData,
    handleFinalise,
    worksheetOptions,
    setSheetId,
  } = useGoogleSheet();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Panel.Header>Data sources</Panel.Header>
      <Panel.Section>
        <Panel.Card>
          <Panel.SubHeader>
            Sync with Google Sheet (experimental)
            <Button variant='ontime-subtle' size='sm' onClick={() => undefined}>
              Reset
            </Button>
          </Panel.SubHeader>
          <Alert status='info' variant='ontime-on-dark-info'>
            <AlertIcon />
            <AlertDescription>
              Ontime allows you to synchronize your rundown with a Google Sheet.
              <br />
              <br />
              To enable this feature, you will need to generate tokens in your Google account and provide them to
              Ontime.
              <br />
              Once set up, you will be able to synchronize data between Ontime and your Google Sheet. <br />
              <ExternalLink href={googleSheetDocsUrl}>See the docs</ExternalLink>
            </AlertDescription>
          </Alert>
          <Panel.SubHeader>1. Setup</Panel.SubHeader>
          <Panel.Section>
            <Panel.Description>Upload Oauth 2.0 Client Secret</Panel.Description>
            <Panel.Error>{stepData.clientSecret.message}</Panel.Error>
            <Input ref={fileInputRef} style={{ display: 'none' }} type='file' onChange={handleFile} accept='.json' />
            <div className={style.buttonRow}>
              <Button variant='ontime-filled' size='sm' onClick={handleFileUploadClick}>
                Upload Oauth Client Secret
              </Button>
            </div>
            <Panel.Description>Verify Client ID</Panel.Description>
            <div className={style.buttonRow}>
              <Button variant='ontime-subtle' size='sm' onClick={testClientSecret}>
                Verify Client ID
              </Button>
            </div>

            <Panel.Description>Authenticate with Google</Panel.Description>
            <Panel.Error>{stepData.authenticate.message}</Panel.Error>
            <div className={style.buttonRow}>
              <Button
                variant='ontime-ghosted'
                size='sm'
                onClick={testAuthentication}
                isDisabled={!stepData.clientSecret.complete}
              >
                Retry authentication
              </Button>
              <Button
                variant='ontime-subtle'
                size='sm'
                onClick={handleAuthenticate}
                isDisabled={!stepData.clientSecret.complete}
              >
                Authenticate
              </Button>
            </div>
          </Panel.Section>

          <Panel.Divider />

          <Panel.SubHeader>2. Import / Export</Panel.SubHeader>
          <Panel.Section>
            <Panel.Description>Add document ID</Panel.Description>
            <Panel.Error>{stepData.id.message}</Panel.Error>
            <div className={style.buttonRow}>
              <Input
                size='sm'
                variant='ontime-filled'
                autoComplete='off'
                onChange={(event) => setSheetId(event.target.value)}
                isDisabled={!stepData.authenticate.complete}
              />
              <Button
                variant='ontime-subtle'
                size='sm'
                onClick={testSheetId}
                isDisabled={!stepData.authenticate.complete}
              >
                Connect
              </Button>
            </div>
          </Panel.Section>
          <Panel.Section>
            <Panel.Description>Select Worksheet</Panel.Description>
            <Panel.Error>{stepData.worksheet.message}</Panel.Error>
            <div className={style.buttonRow}>
              <div className={style.inputContainer}>
                <Select
                  size='sm'
                  variant='ontime'
                  onChange={(event) => testWorksheet(event.target.value)}
                  isDisabled={!stepData.id.complete}
                >
                  {worksheetOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                variant='ontime-subtle'
                size='sm'
                onClick={handlePushData}
                isDisabled={!stepData.worksheet.complete}
              >
                Export
              </Button>
              <Button
                variant='ontime-filled'
                size='sm'
                onClick={handlePullData}
                isDisabled={!stepData.worksheet.complete}
              >
                Import preview
              </Button>
            </div>
            <Panel.Error>{stepData.pullPush.message}</Panel.Error>
          </Panel.Section>

          <Panel.Divider />

          <Panel.SubHeader>3. Review</Panel.SubHeader>
        </Panel.Card>
      </Panel.Section>
    </>
  );
}
