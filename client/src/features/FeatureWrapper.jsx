import React from 'react';
import ProtectRoute from '../common/components/protectRoute/ProtectRoute';
import PropTypes from 'prop-types';
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
