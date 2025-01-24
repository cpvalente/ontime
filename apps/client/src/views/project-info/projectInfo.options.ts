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
        description: 'Weather to show fields related to the backstage views',
        type: 'boolean',
        defaultValue: false,
      },
      {
        id: 'showPublic',
        title: 'Show Public Data',
        description: 'Weather to show fields related to the public views',
        type: 'boolean',
        defaultValue: false,
      },
    ],
  },
];
