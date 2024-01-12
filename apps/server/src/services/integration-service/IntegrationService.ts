import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
import { eventStore } from '../../stores/EventStore.js';

class IntegrationService {
  private integrations: IIntegration<unknown>[];

  constructor() {
    this.integrations = [];
  }

  register(integrationService: IIntegration<unknown>) {
    this.integrations.push(integrationService);
  }

  unregister(integrationService: IIntegration<unknown>) {
    this.integrations = this.integrations.filter((int) => int !== integrationService);
  }

  dispatch(action: TimerLifeCycleKey) {
    const state = eventStore.poll();
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
