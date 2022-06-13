import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import NavLogo from "../../../../common/components/nav/NavLogo";

import style from './LowerClean.module.css';

export default function LowerClean(props) {
  const { lower, title, options } = props;
  const defaults = {
    size: 1,
    transitionIn: 3,
    textColour: '#fffffa',
    posX: 50,
    posY: 700,
  };

  const [showLower, setShowLower] = useState(true);
  // Unmount if fadeOut
  useEffect(() => {
    if (!options.fadeOut) return;

    // Calculate time
    const fadeOutTime =
      (parseInt(options.fadeOut, 10) +
        (options.transitionIn || defaults.transitionIn)) *
      1000;
    if (isNaN(fadeOutTime)) return;

    const timeout = setTimeout(() => {
      setShowLower(false);
    }, fadeOutTime);

    return () => clearTimeout(timeout);
  }, [options.fadeOut, options.transitionIn, defaults.transitionIn]);

  // Format messages
  const showLowerMessage = lower.text !== '' && lower.visible;

  // motion
  // transition segments
  const t = options.transitionIn || defaults.transitionIn;
  const quarter = t / 4;
  const third = t / 3;
  const half = t / 2;

  const lowerThirdVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: third,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: third,
      },
    },
  };

  const titleVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        delay: quarter,
        duration: half,
      },
    },
  };

  const sizeMultiplier = (options.size || 1) * 4;

  return (
    <div
      className={style.lowerThird}
      style={{
        backgroundColor: options.keyColour || defaults.keyColour,
        color: options.textColour || defaults.textColour,
        fontSize: `${sizeMultiplier}vh`,
      }}
    >

      <NavLogo isHidden />

      <AnimatePresence>
        {showLower && (
          <motion.div
            className={style.lowerContainer}
            style={{
              backgroundColor: options.bgColour || defaults.bgColour,
              top: options.posY || defaults.posY,
              left: options.posX || defaults.posX,
            }}
            variants={lowerThirdVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
          >
            <motion.div className={style.title} variants={titleVariants}>
              {title.titleNow}
            </motion.div>
            <motion.div className={style.subtitle} variants={titleVariants}>
              {title.presenterNow}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLowerMessage && (
          <motion.div
            className={style.messageContainer}
            style={{
              backgroundColor: options.bgColour || defaults.bgColour,
            }}
            key='modal'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={style.message}>{lower.text}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
