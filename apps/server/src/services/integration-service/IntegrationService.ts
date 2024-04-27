import { LogOrigin } from 'ontime-types';

import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
import { getState } from '../../stores/runtimeState.js';
import { logger } from '../../classes/Logger.js';

class IntegrationService {
  private integrations: IIntegration<unknown, unknown>[];

  constructor() {
    this.integrations = [];
  }

  register(integrationService: IIntegration<unknown, unknown>) {
    this.integrations.push(integrationService);
  }

  unregister(integrationService: IIntegration<unknown, unknown>) {
    this.integrations = this.integrations.filter((int) => int !== integrationService);
  }

  dispatch(action: TimerLifeCycleKey) {
    /**
     * We currently get the state from the runtimeState store
     * This solves an issue where the state is not updated until after the integrations have ran
     * The workaround solves the issue with the tradeoff of
     * - we do not have access to data outside runtimeState (eg: messages or auxtimers)
     * - we couple the integrationService to runtimeState
     */
    const state = getState();
    this.integrations.forEach((integration) => {
      integration.dispatch(action, state);
    });
  }

  shutdown() {
    logger.info(LogOrigin.Tx, 'Shutdown Integrations');
    this.integrations.forEach((integration) => {
      integration.shutdown();
    });
  }
}

export const integrationService = new IntegrationService();
