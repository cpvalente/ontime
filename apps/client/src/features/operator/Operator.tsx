import { UIEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SupportedEvent, UserFields } from 'ontime-types';

import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import { OPERATOR_OPTIONS } from '../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import { useOperator } from '../../common/hooks/useSocket';
import useRundown from '../../common/hooks-query/useRundown';

import FocusBlock from './focus-block/focus-block';
import OpBlock from './op-block/OpBlock';
import OpEvent from './op-event/OpEvent';
import TimeBlock from './time-block/TimeBlock';
import { getRundownEnd } from './operator.utils';

import style from './Operator.module.scss';

export default function Operator() {
  const { data, status } = useRundown();
  const featureData = useOperator();
  const [showChild, setShowChild] = useState(false);
  const [searchParams] = useSearchParams();

  const handleScroll = (event: UIEvent<HTMLElement>) => {
    const scrollThreshold = 50;
    const scrollPosition = (event.target as HTMLElement).scrollTop;

    setShowChild(scrollPosition > scrollThreshold);
  };

  if (!data || status === 'loading') {
    return <>loading</>;
  }

  const subscribe = searchParams.get('subscribe') as keyof UserFields | null;
  const lastEvent = getRundownEnd(data);
  let eventIndex = 0;

  return (
    <div className={style.operatorContainer}>
      <NavigationMenu />
      <ViewParamsEditor paramFields={OPERATOR_OPTIONS} />

      <div className={style.operatorEvents} onScroll={handleScroll}>
        {data.map((entry) => {
          if (entry.type === SupportedEvent.Event) {
            eventIndex += 1;
            return (
              <OpEvent
                key={entry.id}
                index={eventIndex}
                data={entry}
                isSelected={featureData.selectedEventId === entry.id}
                subscribed={subscribe || undefined}
              />
            );
          }

          if (entry.type === SupportedEvent.Block) {
            return (
              // @arihanv
              // we prefer moving these wrapper divs to the block
              // so that the styles and all attributes can be self-contained
              <div key={entry.id} className={style.block}>
                <OpBlock data={entry} />
              </div>
            );
          }
          return null;
        })}
        {showChild && <FocusBlock />}
      </div>
      <TimeBlock playback={featureData.playback} lastEvent={lastEvent} selectedEventId={featureData.selectedEventId} />
    </div>
  );
}
