import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isOntimeEvent, isOntimeGroup, OntimeView } from 'ontime-types';

import EmptyPage from '../../common/components/state/EmptyPage';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useSelectedEventId } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import useProjectData from '../../common/hooks-query/useProjectData';
import { useRundownWithMetadata } from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import { cx } from '../../common/utils/styleUtils';
import { throttle } from '../../common/utils/throttle';
import { getDefaultFormat } from '../../common/utils/time';

import EditModal from './edit-modal/EditModal';
import FollowButton from './follow-button/FollowButton';
import OperatorEvent from './operator-event/OperatorEvent';
import OperatorGroup from './operator-group/OperatorGroup';
import StatusBar from './status-bar/StatusBar';
import { getOperatorOptions, useOperatorOptions } from './operator.options';
import type { EditEvent } from './operator.types';
import { getEventData } from './operator.utils';

import style from './Operator.module.scss';

const selectedOffset = 50;

export default function Operator() {
  const { data, rundownMetadata, status } = useRundownWithMetadata();
  const { data: customFields, status: customFieldStatus } = useCustomFields();
  const { data: projectData, status: projectDataStatus } = useProjectData();

  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const { selectedEventId } = useSelectedEventId();
  const { subscribe, mainSource, secondarySource, shouldEdit, hidePast, showStart } = useOperatorOptions();
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
    followTrigger: selectedEventId,
  });

  useWindowTitle('Operator');

  // reset scroll if nothing is selected
  useEffect(() => {
    if (!selectedEventId) {
      if (!lockAutoScroll) {
        scrollRef.current?.scrollTo(0, 0);
      }
    }
  }, [selectedEventId, lockAutoScroll, scrollRef]);

  const handleOffset = () => {
    if (selectedEventId) {
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

  // gather option data
  const defaultFormat = getDefaultFormat(settings?.timeFormat);
  const operatorOptions = useMemo(() => getOperatorOptions(customFields, defaultFormat), [customFields, defaultFormat]);

  if (missingData || isLoading) {
    return <EmptyPage text='Loading...' />;
  }

  const canEdit = shouldEdit && subscribe.length;

  return (
    <div className={style.operatorContainer} data-testid='operator-view'>
      <ViewParamsEditor target={OntimeView.Operator} viewOptions={operatorOptions} />
      {editEvent && <EditModal event={editEvent} onClose={() => setEditEvent(null)} />}

      <StatusBar />

      {canEdit && (
        <div className={cx([style.editPrompt, showEditPrompt && style.show])}>Press and hold to edit user field</div>
      )}

      <div className={style.operatorEvents} onWheel={handleScroll} onTouchMove={handleScroll} ref={scrollRef}>
        {data.order.map((entryId) => {
          const entry = data.entries[entryId];
          if (isOntimeEvent(entry)) {
            const { isPast, isLinkedToLoaded, isLoaded, totalGap } = rundownMetadata[entryId];
            // hide past events (if setting) and skipped events
            if ((hidePast && isPast) || entry.skip) {
              return null;
            }

            const { mainField, secondaryField, subscribedData } = getEventData(
              entry,
              mainSource,
              secondarySource,
              subscribe,
              customFields,
            );

            return (
              <OperatorEvent
                key={entry.id}
                id={entry.id}
                colour={entry.colour}
                cue={entry.cue}
                main={mainField}
                secondary={secondaryField}
                timeStart={entry.timeStart}
                duration={entry.duration}
                delay={entry.delay}
                dayOffset={entry.dayOffset}
                isLinkedToLoaded={isLinkedToLoaded}
                isSelected={isLoaded}
                isPast={isPast}
                selectedRef={isLoaded ? selectedRef : undefined}
                showStart={showStart}
                subscribed={subscribedData}
                totalGap={totalGap}
                onLongPress={canEdit ? handleEdit : () => undefined}
              />
            );
          }

          if (isOntimeGroup(entry)) {
            return (
              <Fragment key={entry.id}>
                <OperatorGroup key={entry.id} title={entry.title} />
                {entry.entries.map((nestedEntryId) => {
                  const nestedEntry = data.entries[nestedEntryId];
                  if (!isOntimeEvent(nestedEntry)) {
                    return null;
                  }

                  const { isPast, isLoaded, isLinkedToLoaded, totalGap } = rundownMetadata[nestedEntryId];

                  // hide past events (if setting) and skipped events
                  if ((hidePast && isPast) || nestedEntry.skip) {
                    return null;
                  }

                  const { mainField, secondaryField, subscribedData } = getEventData(
                    nestedEntry,
                    mainSource,
                    secondarySource,
                    subscribe,
                    customFields,
                  );

                  return (
                    <OperatorEvent
                      key={nestedEntry.id}
                      id={nestedEntry.id}
                      colour={nestedEntry.colour}
                      cue={nestedEntry.cue}
                      main={mainField}
                      secondary={secondaryField}
                      timeStart={nestedEntry.timeStart}
                      duration={nestedEntry.duration}
                      delay={nestedEntry.delay}
                      dayOffset={nestedEntry.dayOffset}
                      isLinkedToLoaded={isLinkedToLoaded}
                      isSelected={isLoaded}
                      isPast={isPast}
                      selectedRef={isLoaded ? selectedRef : undefined}
                      showStart={showStart}
                      subscribed={subscribedData}
                      totalGap={totalGap}
                      onLongPress={canEdit ? handleEdit : () => undefined}
                    />
                  );
                })}
              </Fragment>
            );
          }
          return null;
        })}
      </div>
      <FollowButton isVisible={lockAutoScroll} onClickHandler={handleOffset} />
    </div>
  );
}
