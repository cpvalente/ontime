import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconButton } from '@chakra-ui/button';
import { Image } from '@chakra-ui/react';
import { IoExpand } from '@react-icons/all-files/io5/IoExpand';
import navlogo from 'assets/images/logos/LOGO-72.png';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import navigatorConstants from './navigatorConstants';

import style from './NavLogo.module.scss';

/* Styling for action buttons */
const navButtonStyle = {
  size: 'md',
  variant: 'outline',
  colorScheme: 'whiteAlpha',
  _hover: { bg: '#ebedf0', color: '#333' },
};

export default function NavLogo(props) {
  const { isHidden } = props;
  const [showNav, setShowNav] = useState(false);

  const handleClick = useCallback(() => {
    setShowNav((prev) => !prev);
  }, []);

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback((e) => {
    // handle held key
    if (e.repeat) return;
    // Space bar
    if (e.keyCode === 32) {
      setShowNav((s) => !s);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);

    // remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const baseOpacity = isHidden ? 0 : 0.5;
  const tabProps = {
    className: style.navItem,
    tabIndex: 0,
  };

  return (
    <motion.div
      initial={{ opacity: showNav ? 0.5 : baseOpacity }}
      whileHover={{ opacity: 1 }}
      className={style.navContainer}
    >
      <Image alt='' src={navlogo} className={style.logo} onClick={handleClick} />
      <AnimatePresence>
        {showNav && (
          <>
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              whileInView={{ opacity: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              className={style.actions}
            >
              <IconButton
                aria-label='Toggle Fullscreen'
                icon={<IoExpand />}
                onClick={toggleFullscreen}
                {...navButtonStyle}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              whileInView={{ opacity: 1 }}
              exit={{ opacity: 0, scaleY: 0, y: -50 }}
              className={style.nav}
            >
              {navigatorConstants.map((route) => (
                <Link
                  to={route.url}
                  key={route.url}
                  {...tabProps}>
                  {route.label}
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

NavLogo.propTypes = {
  isHidden: PropTypes.bool,
};
