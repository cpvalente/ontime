import { type DatabaseModel } from '../../definitions/DataModel.type.js';

export interface QuickStartData {
  project: Pick<DatabaseModel['project'], 'title'>;
  settings: Pick<DatabaseModel['settings'], 'timeFormat' | 'language'>;
  viewSettings: Pick<DatabaseModel['viewSettings'], 'freezeEnd' | 'endMessage'>;
}
