import PropTypes from "prop-types";
import { Link } from 'react-router-dom';
import { Image } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import navlogo from 'assets/images/logos/LOGO-72.png';
import style from './NavLogo.module.scss';

export default function NavLogo(props) {
  const {isHidden} = props;
  const [showNav, setShowNav] = useState(false);

  const handleClick = () => {
    setShowNav(!showNav);
  };

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback((e) => {
    // handle held key
    if (e.repeat) return;
    // Space bar
    if (e.keyCode === 32) {
      setShowNav((s) => !s);
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

  const baseOpacity = (isHidden) ? 0 : 0.5
  return (
    <motion.div
      initial={{ opacity: baseOpacity }}
      whileHover={{ opacity: 1 }}
      className={style.navContainer}
    >
      <Image
        alt=''
        src={navlogo}
        className={style.logo}
        onClick={handleClick}
      />
      <AnimatePresence>
        {showNav && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scaleY: 0, y: -50 }}
            className={showNav ? style.nav : style.navHidden}
          >
            <Link
              to='/timer'
              className={style.navItem}
              tabIndex={1}
            >
              Timer
            </Link>
            <Link
              to='/minimal'
              className={style.navItem}
              tabIndex={2}
            >
              Minimal Timer
            </Link>
            <Link
              to='/sm'
              className={style.navItem}
              tabIndex={3}
            >
              Backstage
            </Link>
            <Link
              to='/public'
              className={style.navItem}
              tabIndex={4}
            >
              Public
            </Link>
            <Link
              to='/lower'
              className={style.navItem}
              tabIndex={5}
            >
              Lower Thirds
            </Link>
            <Link
              to='/pip'
              className={style.navItem}
              tabIndex={6}
            >
              PIP
            </Link>
            <Link
              to='/studio'
              className={style.navItem}
              tabIndex={7}
            >
              Studio Clock
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

NavLogo.propTypes = {
  isHidden: PropTypes.bool,
}
