import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomField, CustomFields, isOntimeEvent, OntimeEvent, SupportedEvent } from 'ontime-types';
import { getFirstEventNormal, getLastEventNormal } from 'ontime-utils';

import ProductionNavigationMenu from '../../common/components/navigation-menu/ProductionNavigationMenu';
import Empty from '../../common/components/state/Empty';
import { getOperatorOptions } from '../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../common/components/view-params-editor/ViewParamsEditor';
import useFollowComponent from '../../common/hooks/useFollowComponent';
import { useOperator } from '../../common/hooks/useSocket';
import { useWindowTitle } from '../../common/hooks/useWindowTitle';
import useCustomFields from '../../common/hooks-query/useCustomFields';
import useProjectData from '../../common/hooks-query/useProjectData';
import useRundown from '../../common/hooks-query/useRundown';
import useSettings from '../../common/hooks-query/useSettings';
import { debounce } from '../../common/utils/debounce';
import { getDefaultFormat } from '../../common/utils/time';
import { getPropertyValue, isStringBoolean } from '../viewers/common/viewUtils';

import EditModal from './edit-modal/EditModal';
import FollowButton from './follow-button/FollowButton';
import OperatorBlock from './operator-block/OperatorBlock';
import OperatorEvent from './operator-event/OperatorEvent';
import StatusBar from './status-bar/StatusBar';

import style from './Operator.module.scss';

const selectedOffset = 50;

type TitleFields = Pick<OntimeEvent, 'title'>;
export type EditEvent = Pick<OntimeEvent, 'id' | 'cue'> & { fieldLabel?: string; fieldValue: string };
export type PartialEdit = EditEvent & {
  field: keyof CustomFields;
};

export default function Operator() {
  const { data, status } = useRundown();
  const { data: customFields, status: customFieldStatus } = useCustomFields();
  const { data: projectData, status: projectDataStatus } = useProjectData();

  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const featureData = useOperator();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: settings } = useSettings();

  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [editEvent, setEditEvent] = useState<PartialEdit | null>(null);

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
      const field = searchParams.get('subscribe') as keyof CustomField | null;

      if (field) {
        setEditEvent({ ...event, field });
      }
    },
    [searchParams],
  );

  const showEditFormDrawer = useCallback(() => {
    searchParams.set('edit', 'true');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const missingData = !data || !customFields || !projectData;
  const isLoading = status === 'pending' || customFieldStatus === 'pending' || projectDataStatus === 'pending';

  if (missingData || isLoading) {
    return <Empty text='Loading...' />;
  }

  // get fields which the user subscribed to
  const shouldEdit = searchParams.get('shouldEdit');
  const subscribe = searchParams.get('subscribe') as keyof CustomFields;
  const canEdit = shouldEdit && subscribe;

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
      <ProductionNavigationMenu handleSettings={showEditFormDrawer} />
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

            const mainField = main ? entry?.[main] || entry.title : entry.title;
            const secondaryField = getPropertyValue(entry, secondary) ?? '';
            const subscribedData = entry.custom[subscribe]?.value;

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
                subscribeLabel={subscribe}
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
