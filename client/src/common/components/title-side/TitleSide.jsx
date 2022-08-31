import React from 'react';
import PropTypes from 'prop-types';

import './TitleSide.scss';

export default function TitleSide(props) {
  const { type, label, title, subtitle, presenter } = props;

  const isNext = type === 'next';

  return (
    <div className='title-side'>
      <div className='label'>{label}</div>
      <div className={isNext ? 'title next' : 'title now'}>{title}</div>
      <div className={isNext ? 'presenter next' : 'presenter now'}>{presenter}</div>
      <div className={isNext ? 'subtitle next' : 'subtitle now'}>{subtitle}</div>
    </div>
  );
}

TitleSide.propTypes = {
  type: PropTypes.oneOf(['now', 'next']),
  label: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  presenter: PropTypes.string,
}
