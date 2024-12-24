import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isOntimeEvent, OntimeEvent, SupportedEvent } from 'ontime-types';
import { getFirstEventNormal, getLastEventNormal } from 'ontime-utils';

import EmptyPage from '../../common/components/state/EmptyPage';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useOperator } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import useProjectData from '../../common/hooks-query/useProjectData';
import useRundown from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import { throttle } from '../../common/utils/throttle';
import { getDefaultFormat } from '../../common/utils/time';
import { getPropertyValue, isStringBoolean } from '../viewers/common/viewUtils';

import EditModal from './edit-modal/EditModal';
import FollowButton from './follow-button/FollowButton';
import OperatorBlock from './operator-block/OperatorBlock';
import OperatorEvent from './operator-event/OperatorEvent';
import StatusBar from './status-bar/StatusBar';
import { getOperatorOptions } from './operator.options';

import style from './Operator.module.scss';

const selectedOffset = 50;

export type Subscribed = { id: string; label: string; colour: string; value: string }[];
type TitleFields = Pick<OntimeEvent, 'title'>;
export type EditEvent = Pick<OntimeEvent, 'id' | 'cue'> & { subscriptions: Subscribed };

export default function Operator() {
  const { data, status } = useRundown();
  const { data: customFields, status: customFieldStatus } = useCustomFields();
  const { data: projectData, status: projectDataStatus } = useProjectData();

  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const featureData = useOperator();
  const [searchParams] = useSearchParams();
  const { data: settings } = useSettings();

  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [editEvent, setEditEvent] = useState<EditEvent | null>(null);

  const [lockAutoScroll, setLockAutoScroll] = useState(false);
  const selectedRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollToComponent = useFollowComponent({
    followRef: selectedRef,
    scrollRef,
    doFollow: !lockAutoScroll,
    topOffset: selectedOffset,
  });

  useWindowTitle('Operator');

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

  // prevent considering automated scrolls as user scrolls
  const handleUserScroll = () => {
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
  const throttledHandleScroll = throttle(handleUserScroll, 1000);

  const handleScroll = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(() => {
      setShowEditPrompt(false);
    }, 700);

    setShowEditPrompt(true);

    throttledHandleScroll();
  };

  const handleEdit = useCallback((event: EditEvent) => {
    setEditEvent({ ...event });
  }, []);

  const missingData = !data || !customFields || !projectData;
  const isLoading = status === 'pending' || customFieldStatus === 'pending' || projectDataStatus === 'pending';

  if (missingData || isLoading) {
    return <EmptyPage text='Loading...' />;
  }

  // get fields which the user subscribed to
  const shouldEdit = searchParams.get('shouldEdit');

  // subscriptions is a MultiSelect and may have multiple values
  const subscriptions = searchParams.getAll('subscribe').filter((value) => Object.hasOwn(customFields, value));
  const canEdit = shouldEdit && subscriptions;

  const main = searchParams.get('main') as keyof TitleFields | null;
  const secondary = searchParams.get('secondary');

  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const operatorOptions = getOperatorOptions(customFields, defaultFormat);
  let isPast = Boolean(featureData.selectedEventId);
  const hidePast = isStringBoolean(searchParams.get('hidepast'));

  const { firstEvent } = getFirstEventNormal(data.rundown, data.order);
  const { lastEvent } = getLastEventNormal(data.rundown, data.order);

  return (
    <div className={style.operatorContainer}>
      <ViewParamsEditor viewOptions={operatorOptions} />
      {editEvent && <EditModal event={editEvent} onClose={() => setEditEvent(null)} />}

      <StatusBar
        projectTitle={projectData.title}
        playback={featureData.playback}
        selectedEventId={featureData.selectedEventId}
        firstStart={firstEvent?.timeStart}
        firstId={firstEvent?.id}
        lastEnd={lastEvent?.timeEnd}
        lastId={lastEvent?.id}
      />

      {canEdit && (
        <div className={`${style.editPrompt} ${showEditPrompt ? style.show : undefined}`}>
          Press and hold to edit user field
        </div>
      )}

      <div className={style.operatorEvents} onWheel={handleScroll} onTouchMove={handleScroll} ref={scrollRef}>
        {data.order.map((eventId) => {
          const entry = data.rundown[eventId];
          if (isOntimeEvent(entry)) {
            const isSelected = featureData.selectedEventId === entry.id;
            if (isSelected) {
              isPast = false;
            }

            // hide past events (if setting) and skipped events
            if ((hidePast && isPast) || entry.skip) {
              return null;
            }

            const mainField = main ? getPropertyValue(entry, main) ?? '' : entry.title;
            const secondaryField = getPropertyValue(entry, secondary) ?? '';
            const subscribedData = subscriptions
              ? subscriptions.flatMap((id) => {
                  if (!customFields[id]) {
                    return [];
                  }
                  const { label, colour } = customFields[id];
                  return [{ id, label, colour, value: entry.custom[id] }];
                })
              : null;

            return (
              <OperatorEvent
                key={entry.id}
                id={entry.id}
                colour={entry.colour}
                cue={entry.cue}
                main={mainField}
                secondary={secondaryField}
                timeStart={entry.timeStart}
                timeEnd={entry.timeEnd}
                duration={entry.duration}
                delay={entry.delay}
                isSelected={isSelected}
                subscribed={subscribedData}
                isPast={isPast}
                selectedRef={isSelected ? selectedRef : undefined}
                onLongPress={canEdit ? handleEdit : () => undefined}
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
