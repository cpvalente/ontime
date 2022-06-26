import React from 'react';
import { ReactComponent as Emptyimage } from 'assets/images/empty.svg';
import PropTypes from 'prop-types';

import style from './Empty.module.scss';

export default function Empty(props) {
  const { text, dark, ...rest } = props;
  return (
    <div className={`${style.emptyContainer} ${dark ? style.dark : ''}`} {...rest}>
      <Emptyimage className={style.empty} />
      <span className={style.text}>{text}</span>
    </div>
  );
}

Empty.propTypes = {
  text: PropTypes.string,
  dark: PropTypes.bool,
}