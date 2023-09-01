import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isOntimeEvent, SupportedEvent, UserFields } from 'ontime-types';
import { getFirstEvent, getLastEvent } from 'ontime-utils';

import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import Empty from '../../common/components/state/Empty';
import { getOperatorOptions } from '../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useOperator } from '../../common/hooks/useSocket';
import useEventData from '../../common/hooks-query/useEventData';
import useRundown from '../../common/hooks-query/useRundown';
import useUserFields from '../../common/hooks-query/useUserFields';
import { isStringBoolean } from '../../common/utils/viewUtils';

import FollowButton from './follow-button/FollowButton';
import OperatorBlock from './operator-block/OperatorBlock';
import OperatorEvent from './operator-event/OperatorEvent';
import StatusBar from './status-bar/StatusBar';

import style from './Operator.module.scss';

const selectedOffset = 50;

export default function Operator() {
  const { data, status } = useRundown();
  const { data: userFields, status: userFieldsStatus } = useUserFields();
  const { data: projectData, status: projectDataStatus } = useEventData();

  const featureData = useOperator();
  const [searchParams] = useSearchParams();

  const [lockAutoScroll, setLockAutoScroll] = useState(false);
  const selectedRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollToComponent = useFollowComponent({
    followRef: selectedRef,
    scrollRef: scrollRef,
    doFollow: !lockAutoScroll,
    topOffset: selectedOffset,
  });

  // Set window title
  useEffect(() => {
    document.title = 'ontime - Operator';
  }, []);

  // reset scroll if nothing is selected
  useEffect(() => {
    if (!featureData?.selectedEventId) {
      if (!lockAutoScroll) {
        scrollRef.current?.scrollTo(0, 0);
      }
    }
  }, [featureData?.selectedEventId, lockAutoScroll, scrollRef]);

  const handleOffset = () => {
    if (featureData.selectedEventId) {
      scrollToComponent();
    }
    setLockAutoScroll(false);
  };

  const handleScroll = () => {
    if (selectedRef?.current && scrollRef?.current) {
      const selectedRect = selectedRef.current.getBoundingClientRect();
      const scrollerRect = scrollRef.current.getBoundingClientRect();
      if (selectedRect && scrollerRect) {
        const distanceFromTop = selectedRect.top - scrollerRect.top;
        const hasScrolledOutOfThreshold = distanceFromTop < -8 || distanceFromTop > selectedOffset;
        setLockAutoScroll(hasScrolledOutOfThreshold);
      }
    }
  };

  const missingData = !data || !userFields || !projectData;
  const isLoading = status === 'loading' || userFieldsStatus === 'loading' || projectDataStatus === 'loading';

  if (missingData || isLoading) {
    return <Empty text='Loading...' />;
  }

  // get fields which the user subscribed to
  const subscribe = searchParams.get('subscribe') as keyof UserFields | null;
  const subscribedAlias = subscribe ? userFields[subscribe] : '';
  const showSeconds = isStringBoolean(searchParams.get('showseconds'));

  const operatorOptions = getOperatorOptions(userFields);
  let isPast = Boolean(featureData.selectedEventId);
  const hidePast = isStringBoolean(searchParams.get('hidepast'));

  const firstEvent = getFirstEvent(data);
  const lastEvent = getLastEvent(data);

  return (
    <div className={style.operatorContainer}>
      <NavigationMenu />
      <ViewParamsEditor paramFields={operatorOptions} />

      <StatusBar
        projectTitle={projectData.title}
        playback={featureData.playback}
        selectedEventId={featureData.selectedEventId}
        firstStart={firstEvent?.timeStart}
        firstId={firstEvent?.id}
        lastEnd={lastEvent?.timeEnd}
        lastId={lastEvent?.id}
      />

      <div className={style.operatorEvents} onScroll={handleScroll} ref={scrollRef}>
        {data.map((entry) => {
          if (isOntimeEvent(entry)) {
            const isSelected = featureData.selectedEventId === entry.id;
            if (isSelected) {
              isPast = false;
            }

            // hide past events (if setting) and skipped events
            if ((hidePast && isPast) || entry.skip) {
              return null;
            }

            return (
              <OperatorEvent
                key={entry.id}
                cue={entry.cue}
                data={entry}
                isSelected={isSelected}
                subscribed={subscribe}
                subscribedAlias={subscribedAlias}
                showSeconds={showSeconds}
                isPast={isPast}
                selectedRef={isSelected ? selectedRef : undefined}
              />
            );
          }

          if (entry.type === SupportedEvent.Block) {
            return <OperatorBlock key={entry.id} title={entry.title} />;
          }
          return null;
        })}
        <div className={style.spacer} />
      </div>
      <FollowButton isVisible={lockAutoScroll} onClickHandler={handleOffset} />
    </div>
  );
}
