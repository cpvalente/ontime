import React from 'react';
import PropTypes from 'prop-types';

import style from './TitleSide.module.scss';

export default function TitleSide(props) {
  const { type, label, title, subtitle, presenter } = props;

  const titleStyle = type === 'next' ? style.nextTitle : style.nowTitle;
  const subStyle = type === 'next' ? style.nextSubtitle : style.nowSubtitle;
  const presStyle = type === 'next' ? style.nextPresenter : style.nowPresenter;

  return (
    <>
      <div className={style.label}>{label}</div>
      <div className={titleStyle}>{title}</div>
      <div className={presStyle}>{presenter}</div>
      <div className={subStyle}>{subtitle}</div>
    </>
  );
}

TitleSide.propTypes = {
  type: PropTypes.oneOf(['now', 'next']),
  label: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  presenter: PropTypes.string,
}
