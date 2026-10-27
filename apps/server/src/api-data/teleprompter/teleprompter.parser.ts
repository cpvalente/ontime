import type { DatabaseModel, TeleprompterSettings } from 'ontime-types';

import { getPartialProject } from '../../models/dataModel.js';
import { parseTeleprompterSettings } from '../../services/teleprompter-service/teleprompter.utils.js';

export function parseTeleprompter(data: Partial<DatabaseModel>): TeleprompterSettings {
  return parseTeleprompterSettings(data.teleprompter, getPartialProject('teleprompter'));
}
