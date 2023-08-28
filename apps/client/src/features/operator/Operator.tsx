import { UIEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SupportedEvent, UserFields } from 'ontime-types';
import { getLastEvent } from 'ontime-utils';

import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import Empty from '../../common/components/state/Empty';
import { getOperatorOptions } from '../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useOperator } from '../../common/hooks/useSocket';
import useRundown from '../../common/hooks-query/useRundown';
import useUserFields from '../../common/hooks-query/useUserFields';
import { isStringBoolean } from '../../common/utils/viewUtils';

import FollowButton from './follow-button/FollowButton';
import OperatorBlock from './operator-block/OperatorBlock';
import OperatorEvent from './operator-event/OperatorEvent';
import StatusBar from './status-bar/StatusBar';

import style from './Operator.module.scss';

export default function Operator() {
  const { data, status } = useRundown();
  const { data: userFields, status: userFieldsStatus } = useUserFields();
  const featureData = useOperator();
  const [showChild, setShowChild] = useState(false);
  const [searchParams] = useSearchParams();

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Operator';
  }, []);

  const handleScroll = (event: UIEvent<HTMLElement>) => {
    const scrollThreshold = 50;
    const scrollPosition = (event.target as HTMLElement).scrollTop;

    setShowChild(scrollPosition > scrollThreshold);
  };

  if (!data || status === 'loading' || !userFields || userFieldsStatus === 'loading') {
    return <Empty text='Loading...' />;
  }

  // get fields which the user subscribed to
  const subscribe = searchParams.get('subscribe') as keyof UserFields | null;
  const showSeconds = isStringBoolean(searchParams.get('showseconds'));
  const lastEvent = getLastEvent(data);

  const operatorOptions = getOperatorOptions(userFields);

  return (
    <div className={style.operatorContainer}>
      <NavigationMenu />
      <ViewParamsEditor paramFields={operatorOptions} />

      <div className={style.operatorEvents} onScroll={handleScroll}>
        {data.map((entry) => {
          if (entry.type === SupportedEvent.Event) {
            return (
              <OperatorEvent
                key={entry.id}
                cue={entry.cue}
                data={entry}
                isSelected={featureData.selectedEventId === entry.id}
                subscribed={subscribe}
                showSeconds={showSeconds}
              />
            );
          }

          if (entry.type === SupportedEvent.Block) {
            return <OperatorBlock key={entry.id} title={entry.title} />;
          }
          return null;
        })}
      </div>
      <FollowButton isVisible={showChild} onClickHandler={() => undefined} />
      <StatusBar playback={featureData.playback} lastEvent={lastEvent} selectedEventId={featureData.selectedEventId} />
    </div>
  );
}
