import { ChangeEvent, useEffect, useState } from 'react';
import { Button, Input } from '@chakra-ui/react';
import { IoCheckmark } from '@react-icons/all-files/io5/IoCheckmark';
import { IoShieldCheckmarkOutline } from '@react-icons/all-files/io5/IoShieldCheckmarkOutline';

import CopyTag from '../../../../common/components/copy-tag/CopyTag';
import { openLink } from '../../../../common/utils/linkUtils';
import * as Panel from '../PanelUtils';

import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

import style from './SourcesPanel.module.scss';

interface GSheetSetupProps {
  onCancel: () => void;
}

export default function GSheetSetup({ onCancel }: GSheetSetupProps) {
  const { revoke, connect, verifyAuth } = useGoogleSheet();
  const [file, setFile] = useState<File | null>(null);
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<'' | 'cancel' | 'connect' | 'authenticate'>('');
  const [authLink, setAuthLink] = useState('');

  const sheetId = useSheetStore((state) => state.sheetId);
  const setSheetId = useSheetStore((state) => state.setSheetId);

  const authenticationStatus = useSheetStore((state) => state.authenticationStatus);
  const setAuthenticationStatus = useSheetStore((state) => state.setAuthenticationStatus);

  /** Check if we are authenticated */
  const getAuthStatus = async () => {
    const result = await verifyAuth();
    if (result) {
      setAuthenticationStatus(result.authenticated);
    }
  };

  /** check if the current session has been authenticated */
  useEffect(() => {
    getAuthStatus();
  }, []);

  const handleCancelFlow = () => {
    revoke();
    onCancel();
  };

  // user cancels the flow
  const handleRevoke = async () => {
    setLoading('cancel');
    await revoke();
    await getAuthStatus();
    setLoading('');
  };

  /**
   * Gets file from input
   * @param event
   */
  const handleClientSecret = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }
    setFile(event.target.files[0]);
  };

  /**
   * Requests connection to google auth
   */
  const handleConnect = async () => {
    if (!file) return;
    if (!sheetId) return;

    setLoading('connect');
    const result = await connect(file, sheetId);
    if (result) {
      setAuthLink(result.verification_url);
      setAuthKey(result.user_code);
    }
    setLoading('');
  };

  /**
   * Open google auth
   */
  const handleAuthenticate = async () => {
    setLoading('authenticate');

    // open link and schedule a check for when the user focuses again
    openLink(authLink);
    window.addEventListener(
      'focus',
      async () => {
        getAuthStatus();
        setLoading('');
      },
      { once: true },
    );
  };

  const canConnect = file && sheetId;
  const canAuthenticate = Boolean(authKey) && Boolean(authLink);
  const isLoading = Boolean(loading);
  const isAuthenticated = authenticationStatus === 'authenticated';

  return (
    <Panel.Section>
      <Button onClick={getAuthStatus}>check</Button>
      <Panel.Title>
        Sync with Google Sheet (experimental)
        <Button variant='ontime-subtle' size='sm' onClick={handleCancelFlow}>
          Cancel
        </Button>
      </Panel.Title>
      {isAuthenticated ? (
        <Panel.ListGroup>
          <Panel.Title>Authenticated</Panel.Title>
          <Button variant='ontime-subtle' size='sm' onClick={handleRevoke} isLoading={loading === 'cancel'}>
            Revoke Authentication
          </Button>
        </Panel.ListGroup>
      ) : (
        <>
          <Panel.ListGroup>
            <Panel.Description>Upload Client Secret provided by Google</Panel.Description>
            <Panel.Error>{undefined}</Panel.Error>
            <Input
              type='file'
              onChange={handleClientSecret}
              accept='.json'
              size='sm'
              variant='ontime-filled'
              isDisabled={isLoading || canAuthenticate}
            />
          </Panel.ListGroup>

          <Panel.ListGroup>
            <Panel.Description>Enter ID of sheet to synchronise</Panel.Description>
            <Panel.Error>{undefined}</Panel.Error>
            <Input
              size='sm'
              variant='ontime-filled'
              autoComplete='off'
              placeholder='Sheet ID'
              onChange={(event) => setSheetId(event.target.value)}
              isDisabled={isLoading || canAuthenticate}
            />
          </Panel.ListGroup>

          {!canAuthenticate ? (
            <Panel.ListGroup>
              <div className={style.buttonRow}>
                <Button
                  variant='ontime-subtle'
                  size='sm'
                  leftIcon={<IoCheckmark />}
                  onClick={handleConnect}
                  isDisabled={!canConnect || isLoading}
                  isLoading={loading === 'connect'}
                >
                  Connect
                </Button>
              </div>
            </Panel.ListGroup>
          ) : (
            <Panel.ListGroup>
              <div className={style.buttonRow}>
                <CopyTag label='Google Auth Key' disabled={!canAuthenticate} size='sm'>
                  {authKey ? authKey : 'Upload files to generate Auth Key'}
                </CopyTag>
                <Button
                  variant='ontime-filled'
                  size='sm'
                  leftIcon={<IoShieldCheckmarkOutline />}
                  onClick={handleAuthenticate}
                  isDisabled={!canAuthenticate || isLoading}
                  isLoading={loading === 'authenticate'}
                >
                  Authenticate
                </Button>
              </div>
            </Panel.ListGroup>
          )}
        </>
      )}
    </Panel.Section>
  );
}
