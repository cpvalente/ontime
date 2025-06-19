import { OptionTitle } from '../../common/components/view-params-editor/constants';
import { ViewOption } from '../../common/components/view-params-editor/types';

export const projectInfoOptions: ViewOption[] = [
  {
    title: OptionTitle.BehaviourOptions,
    collapsible: true,
    options: [
      {
        id: 'showBackstage',
        title: 'Show backstage Data',
        description: 'Whether to show fields related to the backstage views',
        type: 'boolean',
        defaultValue: false,
      },
      {
        id: 'showCustom',
        title: 'Show Custom Data',
        description: 'Whether to show fields related to the custom data',
        type: 'boolean',
        defaultValue: false,
      },
    ],
  },
];
