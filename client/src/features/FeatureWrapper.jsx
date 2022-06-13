import React from 'react';
import PropTypes from 'prop-types';

import ProtectRoute from '../common/components/protectRoute/ProtectRoute';

import style from './FeatureWrapper.module.scss';

export default function FeatureWrapper({ children }) {
  return (
    <ProtectRoute>
      <div className={style.wrapper}>{children}</div>
    </ProtectRoute>
  );
}

FeatureWrapper.propTypes = {
  children: PropTypes.element,
};
