import React from 'react';
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
