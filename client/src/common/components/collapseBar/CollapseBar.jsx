import React from 'react';
import { Icon } from '@chakra-ui/react';
import { FiChevronUp } from '@react-icons/all-files/fi/FiChevronUp';
import PropTypes from 'prop-types';

import style from './CollapseBar.module.scss';

export default function CollapseBar(props) {
  const { title = 'Collapse bar', isCollapsed, onClick, roll } = props;

  return (
    <div className={roll ? style.headerRoll : style.header}>
      {title}
      <Icon
        className={isCollapsed ? style.moreCollapsed : style.moreExpanded}
        as={FiChevronUp}
        onClick={onClick}
      />
    </div>
  );
}
CollapseBar.propTypes = {
  title: PropTypes.string,
  isCollapsed: PropTypes.bool,
  onClick: PropTypes.func,
  roll: PropTypes.bool,
};
