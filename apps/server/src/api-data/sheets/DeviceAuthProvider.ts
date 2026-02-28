import { Credentials, OAuth2Client } from 'google-auth-library';
import { logger } from '../../classes/Logger.js';
import { LogOrigin, MaybeString, AuthenticationStatus } from 'ontime-types';
import { consoleSubdued } from '../../utils/console.js';
import { type ClientSecret } from './sheets.utils.js';

const codesUrl = 'https://oauth2.googleapis.com/device/code';
const tokenUrl = 'https://oauth2.googleapis.com/token';
const grantType = 'urn:ietf:params:oauth:grant-type:device_code';
const sheetScope = 'https://www.googleapis.com/auth/spreadsheets';

type CodesResponse = {
  device_code: string;
  expires_in: number;
  interval: number;
  user_code: string;
  verification_url: string;
};

export class DeviceAuthProvider {
  private currentAuthClient: OAuth2Client | null = null;
  private currentAuthUrl: MaybeString = null;
  private currentAuthCode: MaybeString = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private cleanupTimeout: NodeJS.Timeout | null = null;

  constructor() {}

  getStatus(): AuthenticationStatus {
    if (this.cleanupTimeout) {
      return 'pending';
    }
    return this.currentAuthClient ? 'authenticated' : 'not_authenticated';
  }

  getAuthClient(): OAuth2Client | null {
    return this.currentAuthClient;
  }

  getPendingData() {
    return {
      verification_url: this.currentAuthUrl,
      user_code: this.currentAuthCode,
    };
  }

  revoke() {
    this.reset();
  }

  private reset() {
    this.currentAuthClient = null;
    this.currentAuthUrl = null;
    this.currentAuthCode = null;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
      this.cleanupTimeout = null;
    }
  }

  async authenticate(clientSecret: ClientSecret, onAuthenticated: (client: OAuth2Client) => Promise<void>) {
    const { device_code, expires_in, interval, user_code, verification_url } = await this.getDeviceCodes(clientSecret);
    this.currentAuthUrl = verification_url;
    this.currentAuthCode = user_code;

    this.verifyConnection(clientSecret, device_code, interval, expires_in, onAuthenticated);

    return { verification_url, user_code };
  }

  private async getDeviceCodes(clientSecret: ClientSecret): Promise<CodesResponse> {
    const response = await fetch(codesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientSecret.installed.client_id,
        scope: sheetScope,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch device codes: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const deviceCodes: CodesResponse = await response.json();
    return deviceCodes;
  }

  private verifyConnection(
    clientSecret: ClientSecret,
    device_code: string,
    interval: number,
    expires_in: number,
    onAuthenticated: (client: OAuth2Client) => Promise<void>,
  ) {
    logger.info(LogOrigin.Server, 'Start polling for auth...');

    this.pollInterval = setInterval(() => this.pollForAuth(clientSecret, device_code, onAuthenticated), interval * 1000);

    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
    }
    this.cleanupTimeout = setTimeout(() => {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
      this.cleanupTimeout = null;
    }, expires_in * 1000);
  }

  private async pollForAuth(
    clientSecret: ClientSecret,
    device_code: string,
    onAuthenticated: (client: OAuth2Client) => Promise<void>,
  ) {
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientSecret.installed.client_id,
          client_secret: clientSecret.installed.client_secret,
          device_code,
          grant_type: grantType,
        }),
      });

      if (response.status === 428) {
        consoleSubdued('User not auth yet');
        return;
      }

      if (!response.ok) {
        logger.error(LogOrigin.Server, `Authentication poll failed with code: ${response.status}`);
        return;
      }

      const auth: Credentials = await response.json();

      logger.info(LogOrigin.Server, 'Successfully Authenticated');
      const client = new OAuth2Client({
        clientId: clientSecret.installed.client_id,
        clientSecret: clientSecret.installed.client_secret,
      });

      client.setCredentials({
        refresh_token: auth.refresh_token,
        access_token: auth.access_token,
        scope: auth.scope,
        token_type: auth.token_type,
      });

      this.currentAuthClient = client;

      if (this.cleanupTimeout) {
        clearTimeout(this.cleanupTimeout);
        this.cleanupTimeout = null;
      }

      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }

      await onAuthenticated(client);
    } catch (error) {
      logger.error(LogOrigin.Server, `Authentication poll error: ${(error as Error).message}`);
    }
  }
}
