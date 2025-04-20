import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomFields } from 'ontime-types';

import { makeOptionsFromCustomFields, OptionTitle } from '../../../common/components/view-params-editor/constants';
import { ViewOption } from '../../../common/components/view-params-editor/types';
import safeParseNumber from '../../../common/utils/safeParseNumber';

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
          description: 'Time on screen before transition out. Set to -1 to stop transition (default 3 seconds) ',
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
          placeholder: '5em',
        },
        {
          id: 'bottom-size',
          title: 'Bottom Text Size',
          description: 'Font size of the bottom text',
          type: 'string',
          placeholder: '4em',
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

type LowerOptions = {
  width: number;
  topSrc: string;
  bottomSrc: string;
  topColour: string;
  bottomColour: string;
  topBg: string;
  bottomBg: string;
  topSize: number;
  bottomSize: number;
  transitionIn: number;
  transitionOut: number;
  hold: number;
  delay: number;
  key: string;
  lineColour: string;
};

const defaultOptions: Readonly<LowerOptions> = {
  width: 45,
  topSrc: 'title',
  bottomSrc: 'lowerMsg',
  topColour: '000000',
  bottomColour: '000000',
  topBg: 'FFF0',
  bottomBg: 'FFF0',
  topSize: 5,
  bottomSize: 4,
  transitionIn: 3,
  transitionOut: 3,
  hold: 3,
  delay: 0,
  key: 'FFF0',
  lineColour: 'FF0000',
};

/**
 * Utility extract the view options from URL Params
 * the names and fallbacks are manually matched with defaultOptions
 */
function getOptionsFromParams(searchParams: URLSearchParams): LowerOptions {
  // we manually make an object that matches the key above
  return {
    width: safeParseNumber(searchParams.get('width'), defaultOptions.width),
    topSrc: searchParams.get('top-src') ?? defaultOptions.topSrc,
    bottomSrc: searchParams.get('bottom-src') ?? defaultOptions.bottomSrc,
    topColour: searchParams.get('top-colour') ?? defaultOptions.topColour,
    bottomColour: searchParams.get('bottom-colour') ?? defaultOptions.bottomColour,
    topBg: searchParams.get('top-bg') ?? defaultOptions.topBg,
    bottomBg: searchParams.get('bottom-bg') ?? defaultOptions.bottomBg,
    topSize: safeParseNumber(searchParams.get('top-size'), defaultOptions.topSize),
    bottomSize: safeParseNumber(searchParams.get('bottom-size'), defaultOptions.bottomSize),
    transitionIn: safeParseNumber(searchParams.get('transition-in'), defaultOptions.transitionIn),
    transitionOut: safeParseNumber(searchParams.get('transition-out'), defaultOptions.transitionOut),
    hold: safeParseNumber(searchParams.get('hold'), defaultOptions.hold),
    delay: safeParseNumber(searchParams.get('hold'), defaultOptions.delay),
    key: searchParams.get('key') ?? defaultOptions.key,
    lineColour: searchParams.get('line-colour') ?? defaultOptions.lineColour,
  };
}

/**
 * Hook exposes the timer view options
 */
export function useLowerOptions(): LowerOptions {
  const [searchParams] = useSearchParams();
  const options = useMemo(() => getOptionsFromParams(searchParams), [searchParams]);
  return options;
}
