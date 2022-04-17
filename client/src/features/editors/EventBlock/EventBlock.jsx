import React, { useContext, useMemo } from 'react';
import Icon from '@chakra-ui/icon';
import { FiChevronUp } from '@react-icons/all-files/fi/FiChevronUp';
import { Draggable } from 'react-beautiful-dnd';
import { millisToMinutes } from 'common/utils/dateConfig';
import PropTypes from 'prop-types';
import { CollapseContext } from '../../../app/context/CollapseContext';
import CollapsedBlock from './CollapsedBlock';
import ExpandedBlock from './ExpandedBlock';
import style from './EventBlock.module.scss';

export default function EventBlock(props) {
  const { data, selected, delay, index, eventIndex, previousEnd, actionHandler, next } = props;
  const { isCollapsed, setCollapsed } = useContext(CollapseContext);
  const collapsed = useMemo(() => isCollapsed(data.id), [data.id, isCollapsed]);

  const selectedStyle = selected ? style.active : '';
  const collapsedStyle = collapsed ? style.collapsed : style.expanded;
  const classSelect = `${style.event} ${collapsedStyle} ${selectedStyle}`;

  // Calculate delay in min
  let delayValue = null;
  if (delay != null && delay !== 0) {
    delayValue = `${delay >= 0 ? '+' : '-'} ${millisToMinutes(Math.abs(delay))}`;
  }
  const handleCollapse = (isCollapsed) => {
    setCollapsed(data.id, isCollapsed);
  };

  return (
    <Draggable key={data.id} draggableId={data.id} index={index}>
      {(provided) => (
        <div className={classSelect} {...provided.draggableProps} ref={provided.innerRef}>
          <Icon
            className={collapsed ? style.moreCollapsed : style.moreExpanded}
            as={FiChevronUp}
            onClick={() => handleCollapse(!collapsed)}
          />
          {collapsed ? (
            <CollapsedBlock
              provided={provided}
              data={data}
              next={next}
              delay={delay}
              delayValue={delayValue}
              previousEnd={previousEnd}
              actionHandler={actionHandler}
            />
          ) : (
            <ExpandedBlock
              provided={provided}
              eventIndex={eventIndex}
              data={data}
              next={next}
              delay={delay}
              delayValue={delayValue}
              previousEnd={previousEnd}
              actionHandler={actionHandler}
            />
          )}
        </div>
      )}
    </Draggable>
  );
}

EventBlock.propTypes = {
  data: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  delay: PropTypes.number,
  index: PropTypes.number.isRequired,
  eventIndex: PropTypes.number.isRequired,
  previousEnd: PropTypes.number,
  actionHandler: PropTypes.func.isRequired,
  next: PropTypes.bool,
};
