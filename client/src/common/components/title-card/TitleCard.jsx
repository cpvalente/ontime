import React from 'react';
import PropTypes from 'prop-types';

import style from './TitleCard.module.scss';

export default function TitleCard(props) {
  const { label, title, subtitle, presenter } = props;

  return (
    <>
      <div className={style.label}>{label}</div>
      <div className={style.title}>{title}</div>
      <div className={style.presenter}>{presenter}</div>
      <div className={style.subtitle}>{subtitle}</div>
    </>
  );
}

TitleCard.propTypes = {
  label: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  presenter: PropTypes.string,
}
