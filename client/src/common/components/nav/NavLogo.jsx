import { Link, Redirect } from 'react-router-dom';
import { Image } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import tinykeys from 'tinykeys';
import navlogo from '../../../assets/images/logos/LOGO-72.png';
import style from './NavLogo.module.css';

export default function NavLogo() {
  const [showNav, setShowNav] = useState(false);

  const handleClick = () => {
    setShowNav(!showNav);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    let unsubscribe = tinykeys(window, {
      Space: () => {
        setShowNav((s) => !s);
      },
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
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
              to='/speaker'
              className={style.navItem}
              tabIndex={1}
              onKeyDownCapture={() => <Redirect push to='/speaker' />}
            >
              Speaker
            </Link>
            <Link
              to='/sm'
              className={style.navItem}
              tabIndex={2}
              onKeyDownCapture={() => <Redirect push to='/sm' />}
            >
              Backstage
            </Link>
            <Link
              to='/public'
              className={style.navItem}
              tabIndex={3}
              onKeyDownCapture={() => <Redirect push to='/public' />}
            >
              Public
            </Link>
            <Link
              to='/lower'
              className={style.navItem}
              tabIndex={4}
              onKeyDownCapture={() => <Redirect push to='/lower' />}
            >
              Lower Thirds
            </Link>
            <Link
              to='/pip'
              className={style.navItem}
              tabIndex={4}
              onKeyDownCapture={() => <Redirect push to='/pip' />}
            >
              PIP
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
