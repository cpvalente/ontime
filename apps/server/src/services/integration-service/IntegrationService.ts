import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
import { runtimeState } from '../../stores/EventStore.js';

class IntegrationService {
  private integrations: IIntegration[];

  constructor() {
    this.integrations = [];
  }

  register(integrationService: IIntegration) {
    this.integrations.push(integrationService);
  }

  unregister(integrationService: IIntegration) {
    this.integrations = this.integrations.filter((int) => int !== integrationService);
  }

  dispatch(action: TimerLifeCycleKey) {
    const state = runtimeState.poll();
    this.integrations.forEach((integration) => {
      integration.dispatch(action, state);
    });
  }

  shutdown() {
    console.log('Shutdown integrations');
    this.integrations.forEach((integration) => {
      integration.shutdown();
    });
  }
}

export const integrationService = new IntegrationService();
