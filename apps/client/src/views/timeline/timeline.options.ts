import { getTimeOption, OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/types';

export const getTimelineOptions = (timeFormat: string): ViewOption[] => {
  return [
    { title: OptionTitle.ClockOptions, collapsible: true, options: [getTimeOption(timeFormat)] },
    {
      title: OptionTitle.ElementVisibility,
      collapsible: true,
      options: [
        {
          id: 'hidePast',
          title: 'Hide Past Events',
          description: 'Whether to hide events that have passed',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
  ];
};
