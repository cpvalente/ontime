import { CustomFields } from 'ontime-types';

import { makeOptionsFromCustomFields, OptionTitle } from '../../../common/components/view-params-editor/constants';
import { ViewOption } from '../../../common/components/view-params-editor/types';

export const getLowerThirdOptions = (customFields: CustomFields): ViewOption[] => {
  const topSourceOptions = makeOptionsFromCustomFields(customFields, {
    title: 'Title',
    note: 'Note',
  });

  const bottomSourceOptions = makeOptionsFromCustomFields(customFields, {
    title: 'Title',
    note: 'Note',
    none: 'None',
  });

  return [
    {
      title: OptionTitle.DataSources,
      collapsible: true,
      options: [
        {
          id: 'top-src',
          title: 'Top Text',
          description: '',
          type: 'option',
          values: topSourceOptions,
          defaultValue: 'title',
        },
        {
          id: 'bottom-src',
          title: 'Bottom Text',
          description: 'Select the data source for the bottom element',
          type: 'option',
          values: bottomSourceOptions,
          defaultValue: 'none',
        },
      ],
    },

    {
      title: OptionTitle.Animation,
      collapsible: true,
      options: [
        {
          id: 'transition-in',
          title: 'Transition In',
          description: 'Transition in time (default 3 seconds)',
          type: 'number',
          placeholder: '3 (default)',
        },
        {
          id: 'transition-out',
          title: 'Transition Out',
          description: 'Transition out time (default 3 seconds)',
          type: 'number',
          placeholder: '3 (default)',
        },
        {
          id: 'hold',
          title: 'Hold',
          description: 'How long to stay on screen before transition out (default 3 seconds)',
          type: 'number',
          placeholder: '3 (default)',
        },
        {
          id: 'delay',
          title: 'Delay',
          description: 'Delay between trigger and transition in (default 0 seconds)',
          type: 'number',
          placeholder: '0 (default)',
        },
      ],
    },

    {
      title: OptionTitle.StyleOverride,
      collapsible: true,
      options: [
        {
          id: 'top-size',
          title: 'Top Text Size',
          description: 'Font size of the top text',
          type: 'string',
          placeholder: '65px',
        },
        {
          id: 'bottom-size',
          title: 'Bottom Text Size',
          description: 'Font size of the bottom text',
          type: 'string',
          placeholder: '64px',
        },
        {
          id: 'width',
          title: 'Minimum Width',
          description: 'Minimum Width of the element',
          type: 'number',
          prefix: '%',
          placeholder: '45 (default)',
        },
        {
          id: 'key',
          title: 'Key Colour',
          description: 'Colour of the background. Default: #FFF0 (transparent)',
          type: 'colour',
          defaultValue: 'FFF0',
        },
        {
          id: 'top-colour',
          title: 'Top Text Colour',
          description: 'Top text colour. Default: #000000',
          type: 'colour',
          defaultValue: '000000',
        },
        {
          id: 'bottom-colour',
          title: 'Bottom Text Colour',
          description: 'Bottom text colour. Default: #000000',
          type: 'colour',
          defaultValue: '000000',
        },
        {
          id: 'top-bg',
          title: 'Top Background Colour',
          description: 'Top text background colour. Default: #FFF0 (transparent)',
          type: 'colour',
          defaultValue: 'FFF0',
        },
        {
          id: 'bottom-bg',
          title: 'Bottom Background Colour',
          description: 'Bottom text background colour. Default: #FFF0 (transparent)',
          type: 'colour',
          defaultValue: 'FFF0',
        },
        {
          id: 'line-colour',
          title: 'Line Colour',
          description: 'Colour of the line. Default: #FF0000',
          type: 'colour',
          defaultValue: 'FF0000',
        },
      ],
    },
  ];
};
