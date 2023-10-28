import IIntegration, { TimerLifeCycleKey } from './IIntegration.js';
import { eventStore } from '../../stores/EventStore.js';

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

  dispatch(action: TimerLifeCycleKey, state?: object) {
    // TODO: eventStore snapshot should be passed in
    const currentState = state || eventStore.poll();
    this.integrations.forEach((integration) => {
      integration.dispatch(action, currentState);
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
