import { ChangeEvent, useEffect, useState } from 'react';
import { IoCheckmark, IoShieldCheckmarkOutline } from 'react-icons/io5';

import { getWorksheetNames } from '../../../../../common/api/sheets';
import { maybeAxiosError } from '../../../../../common/api/utils';
import Button from '../../../../../common/components/buttons/Button';
import CopyTag from '../../../../../common/components/copy-tag/CopyTag';
import Input from '../../../../../common/components/input/input/Input';
import { openLink } from '../../../../../common/utils/linkUtils';
import * as Panel from '../../../panel-utils/PanelUtils';
import useGoogleSheet from './useGoogleSheet';
import { useSheetStore } from './useSheetStore';

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
  const authenticationError = useSheetStore((state) => state.stepData.authenticate.error);

  /** Check if we are authenticated */
  const getAuthStatus = async () => {
    const result = await verifyAuth();
    if (result) {
      setAuthenticationStatus(result.authenticated);
    }
  };

  /** check if the current session has been authenticated */
  useEffect(() => {
    patchStepData({ authenticate: { available: false, error: '' } });
    untilAuthenticated();
  }, []);

  // user cancels the flow
  const handleRevoke = async () => {
    setLoading('cancel');
    await revoke();
    await getAuthStatus();
    setLoading('');
  };

  const handleCancelFlow = () => {
    onCancel();
  };

  /**
   * Gets file from input
   */
  const handleClientSecret = (event: ChangeEvent<HTMLInputElement>) => {
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
    patchStepData({ worksheet: { available: false, error: '' } });

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
          <Button onClick={handleRevoke} loading={loading === 'cancel'}>
            Revoke Authentication
          </Button>
        ) : (
          <Button onClick={handleCancelFlow}>Go Back</Button>
        )}
      </Panel.Title>
      <Panel.ListGroup>
        <Panel.Description>Upload Client Secret provided by Google</Panel.Description>
        <Panel.Error>{authenticationError}</Panel.Error>
        <Input fluid type='file' onChange={handleClientSecret} accept='.json' disabled={isLoading || canAuthenticate} />
      </Panel.ListGroup>
      <Panel.ListGroup>
        <Panel.Description>Enter ID of sheet to synchronise</Panel.Description>
        <Panel.Error>{undefined}</Panel.Error>
        <Input
          fluid
          placeholder='Sheet ID'
          onChange={(event) => setSheetId(event.target.value)}
          disabled={isLoading || canAuthenticate}
        />
      </Panel.ListGroup>
      {!canAuthenticate ? (
        <Panel.ListGroup>
          <Panel.InlineElements>
            <Button onClick={handleConnect} disabled={!canConnect || isLoading} loading={loading === 'connect'}>
              <IoCheckmark />
              Connect
            </Button>
          </Panel.InlineElements>
        </Panel.ListGroup>
      ) : (
        <Panel.ListGroup>
          <Panel.InlineElements>
            {isAuthenticating && <span>Authenticating...</span>}
            <CopyTag copyValue={authKey ?? ''} disabled={!canAuthenticate}>
              {authKey ? authKey : 'Upload files to generate Auth Key'}
            </CopyTag>
            <Button onClick={handleAuthenticate} disabled={!canAuthenticate}>
              <IoShieldCheckmarkOutline />
              Authenticate
            </Button>
          </Panel.InlineElements>
        </Panel.ListGroup>
      )}
    </Panel.Section>
  );
}
