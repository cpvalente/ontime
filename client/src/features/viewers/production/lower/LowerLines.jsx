import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import NavLogo from "../../../../common/components/nav/NavLogo";

import style from './LowerLines.module.css';

export default function LowerLines(props) {
  const { lower, title, options } = props;
  const defaults = {
    size: 1,
    transitionIn: 3,
    textColour: '#fffffa',
    bgColour: '#00000033',
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

  useEffect(() => {
    setShowLower(title.showNow);
  }, [title.showNow]);

  // Format messages
  const showLowerMessage = lower.text !== '' && lower.visible;

  // motion
  // transition segments
  const t = options.transitionIn || defaults.transitionIn;
  const eight = t / 8;
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
      x: -1000,
      transition: {
        duration: third,
      },
    },
  };

  const titleContainerVariants = {
    hidden: {
      left: -1000,
    },
    visible: {
      left: 0,
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

  const subtitleContainerVariants = {
    hidden: {
      left: -1000,
    },
    visible: {
      left: 0,
      transition: {
        delay: eight,
        duration: third,
      },
    },
  };

  const subtitleVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        delay: third,
        duration: third * 2,
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
            style={{ backgroundColor: options.bgColour || defaults.bgColour }}
            variants={lowerThirdVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
          >
            <motion.div
              className={style.titleContainer}
              variants={titleContainerVariants}
            >
              <motion.div className={style.title} variants={titleVariants}>
                {title.titleNow}
              </motion.div>
              <div className={style.titleDecor} />
            </motion.div>
            <motion.div
              className={style.subtitleContainer}
              variants={subtitleContainerVariants}
            >
              <div className={style.subDecor} />
              <motion.div
                className={style.subtitle}
                variants={subtitleVariants}
              >
                {title.presenterNow}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLowerMessage && (
          <motion.div
            className={style.messageContainer}
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
