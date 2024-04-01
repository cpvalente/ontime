import { ChangeEvent, useEffect, useState } from 'react';
import { Button, Input, Spinner } from '@chakra-ui/react';
import { IoCheckmark } from '@react-icons/all-files/io5/IoCheckmark';
import { IoShieldCheckmarkOutline } from '@react-icons/all-files/io5/IoShieldCheckmarkOutline';

import { getWorksheetNames } from '../../../../common/api/sheets';
import { maybeAxiosError } from '../../../../common/api/utils';
import CopyTag from '../../../../common/components/copy-tag/CopyTag';
import { openLink } from '../../../../common/utils/linkUtils';
import * as Panel from '../PanelUtils';

import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

import style from './SourcesPanel.module.scss';

interface GSheetSetupProps {
  onCancel: () => void;
}

export default function GSheetSetup(props: GSheetSetupProps) {
  const { onCancel } = props;

  const { revoke, connect, verifyAuth } = useGoogleSheet();
  const [file, setFile] = useState<File | null>(null);
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<'' | 'cancel' | 'connect' | 'authenticate'>('');
  const [authLink, setAuthLink] = useState('');

  const sheetId = useSheetStore((state) => state.sheetId);
  const setSheetId = useSheetStore((state) => state.setSheetId);
  const setWorksheets = useSheetStore((state) => state.setWorksheets);
  const patchStepData = useSheetStore((state) => state.patchStepData);
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
    untilAuthenticated();
  }, []);

  // user cancels the flow
  const handleRevoke = async () => {
    setLoading('cancel');
    await revoke();
    await getAuthStatus();
    setLoading('');
  };

  const handleCancelFlow = async () => {
    onCancel();
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

  const untilAuthenticated = async (attempts: number = 0) => {
    const result = await verifyAuth();
    if (result?.authenticated) {
      setAuthenticationStatus(result.authenticated);
      if (result.authenticated !== 'pending') {
        if (result.authenticated == 'authenticated') {
          try {
            const names = await getWorksheetNames(result.sheetId);
            setWorksheets(names);
          } catch (error) {
            const message = maybeAxiosError(error);
            patchStepData({ worksheet: { available: false, error: message } });
          }
        }
        setLoading('');
        return;
      }
    }
    if (attempts <= 10) {
      setTimeout(() => untilAuthenticated(attempts + 1), 2000);
      return;
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
        untilAuthenticated();
      },
      { once: true },
    );
  };

  const canConnect = file && sheetId;
  const canAuthenticate = Boolean(authKey) && Boolean(authLink);
  const isLoading = Boolean(loading);
  const isAuthenticated = authenticationStatus === 'authenticated';
  const isAuthenticating = authenticationStatus === 'pending';

  return (
    <Panel.Section>
      <Panel.Title>
        Sync with Google Sheet (experimental)
        {isAuthenticated ? (
          <Button variant='ontime-subtle' size='sm' onClick={handleRevoke} isLoading={loading === 'cancel'}>
            Revoke Authentication
          </Button>
        ) : (
          <Button variant='ontime-subtle' size='sm' onClick={handleCancelFlow}>
            Go Back
          </Button>
        )}
      </Panel.Title>
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
            {
              //TODO: better spinner
              isAuthenticating ? <Spinner /> : <></>
            }
            <CopyTag label='Google Auth Key' disabled={!canAuthenticate} size='sm'>
              {authKey ? authKey : 'Upload files to generate Auth Key'}
            </CopyTag>
            <Button
              variant='ontime-filled'
              size='sm'
              leftIcon={<IoShieldCheckmarkOutline />}
              onClick={handleAuthenticate}
              isDisabled={!canAuthenticate}
            >
              Authenticate
            </Button>
          </div>
        </Panel.ListGroup>
      )}
    </Panel.Section>
  );
}
