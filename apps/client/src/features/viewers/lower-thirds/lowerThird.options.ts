import { CustomFields } from 'ontime-types';

import { makeOptionsFromCustomFields } from '../../../common/components/view-params-editor/constants';
import { ViewOption } from '../../../common/components/view-params-editor/types';

export const getLowerThirdOptions = (customFields: CustomFields): ViewOption[] => {
  const topSourceOptions = makeOptionsFromCustomFields(customFields, {
    title: 'Title',
  });

  const bottomSourceOptions = makeOptionsFromCustomFields(customFields, {
    title: 'Title',
    none: 'None',
  });

  return [
    { section: 'Data sources' },
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
    { section: 'View style override' },
    {
      id: 'top-colour',
      title: 'Top Text Colour',
      description: 'Top text colour in hexadecimal',
      prefix: '#',
      type: 'string',
      placeholder: '0000ff (default)',
    },
    {
      id: 'bottom-colour',
      title: 'Bottom Text Colour',
      description: 'Bottom text colour in hexadecimal',
      prefix: '#',
      type: 'string',
      placeholder: '0000ff (default)',
    },
    {
      id: 'top-bg',
      title: 'Top Background Colour',
      description: 'Top text background colour in hexadecimal',
      prefix: '#',
      type: 'string',
      placeholder: '00000000 (default)',
    },
    {
      id: 'bottom-bg',
      title: 'Bottom Background Colour',
      description: 'Bottom text background colour in hexadecimal',
      prefix: '#',
      type: 'string',
      placeholder: '00000000 (default)',
    },
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
      id: 'transition',
      title: 'Transition',
      description: 'Transition in time in seconds (default 3)',
      type: 'number',
      placeholder: '3 (default)',
    },
    {
      id: 'delay',
      title: 'Delay',
      description: 'Delay between transition in and out in seconds (default 3)',
      type: 'number',
      placeholder: '3 (default)',
    },
    {
      id: 'key',
      title: 'Key Colour',
      description: 'Colour of the background',
      prefix: '#',
      type: 'string',
      placeholder: 'ffffffff (default)',
    },
    {
      id: 'line-colour',
      title: 'Line Colour',
      description: 'Colour of the line',
      prefix: '#',
      type: 'string',
      placeholder: 'ff0000ff (default)',
    },
  ];
};
