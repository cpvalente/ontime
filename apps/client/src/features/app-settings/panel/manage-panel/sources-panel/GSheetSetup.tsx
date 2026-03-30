import type { AuthenticationStatus, SpreadsheetWorksheetOptions } from 'ontime-types';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { IoCheckmark, IoCloudDownloadOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';

import {
  getWorksheetOptions,
  requestConnection,
  revokeAuthentication,
  verifyAuthenticationStatus,
} from '../../../../../common/api/sheets';
import { maybeAxiosError } from '../../../../../common/api/utils';
import Button from '../../../../../common/components/buttons/Button';
import CopyTag from '../../../../../common/components/copy-tag/CopyTag';
import Input from '../../../../../common/components/input/input/Input';
import Tag from '../../../../../common/components/tag/Tag';
import { openLink } from '../../../../../common/utils/linkUtils';
import * as Panel from '../../../panel-utils/PanelUtils';

import style from './SourcesPanel.module.scss';

interface GSheetSetupProps {
  onCancel: () => void;
  onSheetLoaded: (sheetId: string, options: SpreadsheetWorksheetOptions) => void;
}

export default function GSheetSetup(props: GSheetSetupProps) {
  const { onCancel, onSheetLoaded } = props;

  const [file, setFile] = useState<File | null>(null);
  const [sheetId, setSheetId] = useState('');
  const [authenticationStatus, setAuthenticationStatus] = useState<AuthenticationStatus>('not_authenticated');
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<'' | 'cancel' | 'connect' | 'authenticate' | 'load-sheet'>('');
  const [authLink, setAuthLink] = useState('');
  const [authError, setAuthError] = useState('');
  const [worksheetError, setWorksheetError] = useState('');
  const pollTimeoutRef = useRef<number | null>(null);
  const authFallbackTimeoutRef = useRef<number | null>(null);
  const focusListenerRef = useRef<(() => void) | null>(null);

  const clearPollTimeout = useCallback(() => {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const clearAuthFallbackTimeout = useCallback(() => {
    if (authFallbackTimeoutRef.current !== null) {
      window.clearTimeout(authFallbackTimeoutRef.current);
      authFallbackTimeoutRef.current = null;
    }
  }, []);

  const clearFocusListener = useCallback(() => {
    if (focusListenerRef.current !== null) {
      window.removeEventListener('focus', focusListenerRef.current);
      focusListenerRef.current = null;
    }
  }, []);

  const loadWorksheetOptions = useCallback(
    async (nextSheetId: string) => {
      const worksheetOptions = await getWorksheetOptions(nextSheetId);
      onSheetLoaded(nextSheetId, worksheetOptions);
      setWorksheetError('');
    },
    [onSheetLoaded],
  );

  const pollUntilAuthenticated = useCallback(
    async (attempts: number = 0) => {
      clearPollTimeout();

      try {
        const result = await verifyAuthenticationStatus();
        setAuthenticationStatus(result.authenticated);
        setSheetId(result.sheetId);

        if (result.authenticated === 'pending') {
          if (attempts < 10) {
            pollTimeoutRef.current = window.setTimeout(() => {
              pollUntilAuthenticated(attempts + 1);
            }, 2000);
          } else {
            setLoading('');
          }
          return;
        }

        if (result.authenticated === 'authenticated') {
          try {
            await loadWorksheetOptions(result.sheetId);
          } catch (error) {
            setWorksheetError(maybeAxiosError(error));
          }
        }

        setLoading('');
      } catch (error) {
        setAuthError(maybeAxiosError(error));
        setLoading('');
      }
    },
    [clearPollTimeout, loadWorksheetOptions],
  );

  /** check if the current session has been authenticated */
  useEffect(() => {
    setAuthError('');
    pollUntilAuthenticated();

    return () => {
      clearFocusListener();
      clearPollTimeout();
      clearAuthFallbackTimeout();
    };
  }, [clearAuthFallbackTimeout, clearFocusListener, clearPollTimeout, pollUntilAuthenticated]);

  // user cancels the flow
  const handleRevoke = async () => {
    setLoading('cancel');
    try {
      const result = await revokeAuthentication();
      setAuthenticationStatus(result.authenticated);
      setSheetId('');
      setAuthKey(null);
      setAuthLink('');
      setAuthError('');
      setWorksheetError('');
    } catch (error) {
      setAuthError(maybeAxiosError(error));
    } finally {
      setLoading('');
    }
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
    setLoading('connect');
    setAuthError('');
    setWorksheetError('');

    try {
      const result = await requestConnection(file, sheetId);
      setAuthLink(result.verification_url);
      setAuthKey(result.user_code);
    } catch (error) {
      setAuthError(maybeAxiosError(error));
    } finally {
      setLoading('');
    }
  };

  /**
   * Open google auth
   */
  const handleAuthenticate = () => {
    setLoading('authenticate');
    setAuthError('');
    clearFocusListener();
    clearPollTimeout();
    clearAuthFallbackTimeout();

    // open link and schedule a check for when the user focuses again
    openLink(authLink);
    authFallbackTimeoutRef.current = window.setTimeout(() => {
      if (document.hasFocus()) {
        setLoading('');
      }
    }, 1500);

    function authFocusHandler() {
      clearAuthFallbackTimeout();
      clearFocusListener();
      pollUntilAuthenticated();
    }

    focusListenerRef.current = authFocusHandler;
    window.addEventListener('focus', authFocusHandler, { once: true });
  };

  const handleLoadSheet = async () => {
    if (!sheetId) return;

    setLoading('load-sheet');
    setWorksheetError('');

    try {
      await loadWorksheetOptions(sheetId);
    } catch (error) {
      setWorksheetError(maybeAxiosError(error));
    } finally {
      setLoading('');
    }
  };

  const canConnect = Boolean(file) && Boolean(sheetId);
  const canLoadSheet = Boolean(sheetId);
  const canAuthenticate = Boolean(authKey) && Boolean(authLink);
  const isLoading = Boolean(loading);
  const isAuthenticated = authenticationStatus === 'authenticated';
  const isAuthenticating = authenticationStatus === 'pending';
  const statusLabel = isAuthenticated ? 'Connected' : isAuthenticating ? 'Waiting for confirmation' : 'Not connected';
  const statusClass = isAuthenticated ? style.statusReady : isAuthenticating ? style.statusPending : style.statusIdle;
  const statusVariant = isAuthenticated ? 'default' : 'warning';
  const setupMessage = isAuthenticated
    ? 'Load a spreadsheet by its Google Sheet ID.'
    : canAuthenticate
      ? 'Finish the device verification in your browser, then return here.'
      : 'Upload your client secret and enter the sheet ID you want to access.';

  return (
    <Panel.Section className={style.setupShell}>
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
      <div className={style.setupIntro}>
        <div className={style.setupIntroText}>
          <p className={style.setupLead}>{statusLabel}</p>
          <p className={style.setupBody}>{setupMessage}</p>
        </div>
        <Tag className={statusClass} variant={statusVariant}>
          {statusLabel}
        </Tag>
      </div>
      {!isAuthenticated && (
        <Panel.ListGroup className={style.setupBlock}>
          <Panel.Description>Upload Client Secret provided by Google</Panel.Description>
          <Panel.Error>{authError}</Panel.Error>
          <Input
            fluid
            type='file'
            onChange={handleClientSecret}
            accept='.json'
            disabled={isLoading || canAuthenticate}
          />
          <div className={style.setupHint}>Use the OAuth client JSON downloaded from your Google Cloud project.</div>
        </Panel.ListGroup>
      )}
      {isAuthenticated && authError && (
        <Panel.ListGroup className={style.setupBlock}>
          <Panel.Error>{authError}</Panel.Error>
        </Panel.ListGroup>
      )}
      <Panel.ListGroup className={style.setupBlock}>
        <Panel.Description>Enter ID of sheet to synchronise</Panel.Description>
        <Panel.Error>{worksheetError}</Panel.Error>
        <Input
          fluid
          value={sheetId}
          placeholder='Sheet ID'
          onChange={(event) => {
            setWorksheetError('');
            setSheetId(event.target.value);
          }}
          disabled={isLoading || canAuthenticate}
        />
      </Panel.ListGroup>
      {isAuthenticated ? (
        <Panel.ListGroup className={style.setupBlock}>
          <Panel.Description>Load the current spreadsheet configuration</Panel.Description>
          <Panel.InlineElements wrap='wrap' className={style.setupActions}>
            <Button onClick={handleLoadSheet} disabled={!canLoadSheet || isLoading} loading={loading === 'load-sheet'}>
              <IoCloudDownloadOutline />
              Load sheet
            </Button>
          </Panel.InlineElements>
        </Panel.ListGroup>
      ) : !canAuthenticate ? (
        <Panel.ListGroup className={style.setupBlock}>
          <Panel.Description>Generate a Google device code</Panel.Description>
          <Panel.InlineElements wrap='wrap' className={style.setupActions}>
            <Button onClick={handleConnect} disabled={!canConnect || isLoading} loading={loading === 'connect'}>
              <IoCheckmark />
              Connect
            </Button>
          </Panel.InlineElements>
        </Panel.ListGroup>
      ) : (
        <Panel.ListGroup className={style.setupBlock}>
          <Panel.Description>Authenticate this Ontime session with Google</Panel.Description>
          <Panel.InlineElements wrap='wrap' className={style.setupActions}>
            {isAuthenticating && <span>Authenticating...</span>}
            <CopyTag copyValue={authKey ?? ''} disabled={!canAuthenticate}>
              {authKey ? authKey : 'Upload files to generate Auth Key'}
            </CopyTag>
            <Button onClick={handleAuthenticate} disabled={!canAuthenticate}>
              <IoShieldCheckmarkOutline />
              Authenticate
            </Button>
          </Panel.InlineElements>
          <div className={style.setupHint}>Open the browser prompt, complete the code flow, then come back here.</div>
        </Panel.ListGroup>
      )}
    </Panel.Section>
  );
}
