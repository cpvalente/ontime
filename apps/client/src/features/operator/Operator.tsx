import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isOntimeEvent, OntimeEvent, SupportedEvent, UserFields } from 'ontime-types';
import { getFirstEvent, getLastEvent } from 'ontime-utils';

import NavigationMenu from '../../common/components/navigation-menu/NavigationMenu';
import Empty from '../../common/components/state/Empty';
import { getOperatorOptions } from '../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useOperator } from '../../common/hooks/useSocket';
import useProjectData from '../../common/hooks-query/useProjectData';
import useRundown from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import useUserFields from '../../common/hooks-query/useUserFields';
import { debounce } from '../../common/utils/debounce';
import { isStringBoolean } from '../../common/utils/viewUtils';

import EditModal from './edit-modal/EditModal';
import FollowButton from './follow-button/FollowButton';
import OperatorBlock from './operator-block/OperatorBlock';
import OperatorEvent from './operator-event/OperatorEvent';
import StatusBar from './status-bar/StatusBar';

import style from './Operator.module.scss';

const selectedOffset = 50;

type TitleFields = Pick<OntimeEvent, 'title' | 'subtitle' | 'presenter'>;
export type EditEvent = Pick<OntimeEvent, 'id' | 'cue'> & { fieldLabel?: string; fieldValue: string };
export type PartialEdit = EditEvent & {
  field: keyof UserFields;
};

export default function Operator() {
  const { data, status } = useRundown();
  const { data: userFields, status: userFieldsStatus } = useUserFields();
  const { data: projectData, status: projectDataStatus } = useProjectData();

  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const featureData = useOperator();
  const [searchParams] = useSearchParams();
  const { data: settings } = useSettings();

  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [editEvent, setEditEvent] = useState<PartialEdit | null>(null);

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
  const debouncedHandleScroll = debounce(handleUserScroll, 1000);

  const handleScroll = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(() => {
      setShowEditPrompt(false);
    }, 700);

    setShowEditPrompt(true);

    debouncedHandleScroll();
  };

  const handleEdit = useCallback(
    (event: EditEvent) => {
      const field = searchParams.get('subscribe') as keyof UserFields | null;

      if (field) {
        setEditEvent({ ...event, field });
      }
    },
    [searchParams],
  );

  const missingData = !data || !userFields || !projectData;
  const isLoading = status === 'pending' || userFieldsStatus === 'pending' || projectDataStatus === 'pending';

  if (missingData || isLoading) {
    return <Empty text='Loading...' />;
  }

  // get fields which the user subscribed to
  const shouldEdit = searchParams.get('shouldEdit');
  const subscribe = searchParams.get('subscribe') as keyof UserFields | null;
  const canEdit = shouldEdit && subscribe;

  const main = searchParams.get('main') as keyof TitleFields | null;
  const secondary = searchParams.get('secondary') as keyof TitleFields | null;
  const subscribedAlias = subscribe ? userFields[subscribe] : '';
  const showSeconds = isStringBoolean(searchParams.get('showseconds'));

  const operatorOptions = getOperatorOptions(userFields, settings?.timeFormat ?? '24');
  let isPast = Boolean(featureData.selectedEventId);
  const hidePast = isStringBoolean(searchParams.get('hidepast'));

  const firstEvent = getFirstEvent(data);
  const lastEvent = getLastEvent(data);

  return (
    <div className={style.operatorContainer}>
      <NavigationMenu />
      <ViewParamsEditor paramFields={operatorOptions} />
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

            const mainField = main ? entry?.[main] || entry.title : entry.title;
            const secondaryField = secondary ? entry?.[secondary] || entry.subtitle : entry.subtitle;
            const subscribedData = (subscribe ? entry?.[subscribe] : undefined) || '';

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
                subscribedAlias={subscribedAlias}
                showSeconds={showSeconds}
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
