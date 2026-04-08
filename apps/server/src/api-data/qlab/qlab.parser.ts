import { DatabaseModel, QlabSettings } from 'ontime-types';

import { dbModel } from '../../models/dataModel.js';

export function parseQlabSettings(data: Partial<DatabaseModel>): QlabSettings {
  if (!data.qlab) {
    return { ...dbModel.qlab };
  }

  return {
    enabled: typeof data.qlab.enabled === 'boolean' ? data.qlab.enabled : dbModel.qlab.enabled,
    host: typeof data.qlab.host === 'string' ? data.qlab.host : dbModel.qlab.host,
    port: typeof data.qlab.port === 'number' ? data.qlab.port : dbModel.qlab.port,
    listenPort: typeof data.qlab.listenPort === 'number' ? data.qlab.listenPort : dbModel.qlab.listenPort,
    filterByColor: typeof data.qlab.filterByColor === 'string' ? data.qlab.filterByColor : null,
    filterByType: typeof data.qlab.filterByType === 'string' ? data.qlab.filterByType : null,
    filterByCueNumber: typeof data.qlab.filterByCueNumber === 'string' ? data.qlab.filterByCueNumber : null,
    warningThreshold:
      typeof data.qlab.warningThreshold === 'number' ? data.qlab.warningThreshold : dbModel.qlab.warningThreshold,
    dangerThreshold:
      typeof data.qlab.dangerThreshold === 'number' ? data.qlab.dangerThreshold : dbModel.qlab.dangerThreshold,
    timeout: typeof data.qlab.timeout === 'number' ? data.qlab.timeout : dbModel.qlab.timeout,
  };
}
