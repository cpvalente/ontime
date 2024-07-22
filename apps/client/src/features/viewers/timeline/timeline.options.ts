import { getTimeOption } from '../../../common/components/view-params-editor/constants';
import { ViewOption } from '../../../common/components/view-params-editor/types';

export const getTimelineOptions = (timeFormat: string): ViewOption[] => {
  return [
    getTimeOption(timeFormat),
    {
      id: 'hidePast',
      title: 'Hide Past Events',
      description: 'Whether to hide events that have passed',
      type: 'boolean',
      defaultValue: false,
    },
    {
      id: 'hideBackstage',
      title: 'Hide Private Events',
      description: 'Whether to hide non-public events',
      type: 'boolean',
      defaultValue: false,
    },
  ];
};
