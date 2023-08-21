import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Message } from 'ontime-types';

import NavigationMenu from '../../../common/components/navigation-menu/NavigationMenu';
import { LOWER_THIRDS_OPTIONS } from '../../../common/components/view-params-editor/constants';
import ViewParamsEditor from '../../../common/components/view-params-editor/ViewParamsEditor';

import { LowerOptions } from './LowerWrapper';

import './LowerLines.scss';

interface LowerLinesProps {
  lower: Message;
  heading: string;
  subheading: string;
  options: LowerOptions;
  doShow: boolean;
}

export default function LowerLines(props: LowerLinesProps) {
  const { lower, heading, subheading, options, doShow } = props;
  const [showLower, setShowLower] = useState(true);

  // Unmount if fadeOut
  useEffect(() => {
    if (!options.fadeOut) return;

    // Calculate time
    const fadeOutTime = (options.fadeOut + options.transitionIn) * 1000;

    const timeout = setTimeout(() => {
      setShowLower(false);
    }, fadeOutTime);

    return () => clearTimeout(timeout);
  }, [options.fadeOut, options.transitionIn]);

  useEffect(() => {
    setShowLower(doShow);
  }, [doShow]);

  // Format messages
  const showLowerMessage = lower.text !== '' && lower.visible;

  // motion
  // transition segments
  const t = options.transitionIn;
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
      className='lower-third lines'
      style={{
        backgroundColor: options.keyColour,
        color: options.textColour,
        fontSize: `${sizeMultiplier}vh`,
      }}
    >
      <NavigationMenu />
      <ViewParamsEditor paramFields={LOWER_THIRDS_OPTIONS} />

      <AnimatePresence>
        {showLower && (
          <motion.div
            className='lower-container'
            style={{ backgroundColor: options.bgColour }}
            variants={lowerThirdVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
          >
            <motion.div className='title-container' variants={titleContainerVariants}>
              <motion.div className='title' variants={titleVariants}>
                {heading}
              </motion.div>
              <div className='title-decor' />
            </motion.div>
            <motion.div className='subtitle-container' variants={subtitleContainerVariants}>
              <div className='sub-decor' />
              <motion.div className='subtitle' variants={subtitleVariants}>
                {subheading}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLowerMessage && (
          <motion.div
            className='message-container'
            key='modal'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className='message'>{lower.text}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
