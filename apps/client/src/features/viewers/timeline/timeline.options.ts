import { getTimeOption } from '../../../common/components/view-params-editor/constants';
import { ViewOption } from '../../../common/components/view-params-editor/types';

export const getTimelineOptions = (timeFormat: string): ViewOption[] => {
  return [getTimeOption(timeFormat)];
};
