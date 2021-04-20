import { AnimatePresence, motion } from 'framer-motion';
import style from './Lower.module.css';

export default function Lower(props) {
  const { pres, publ, lower, title, time, events, selectedId, general } = props;

  // getting config from URL
  // like http://localhost:3000/lower?bg=ff2&text=f00&size=0.6&transition=5
  let params = new URLSearchParams(props.location.search);

  const preset = params.get('preset') ? params.get('preset') : 1;
  const size = params.get('size') ? params.get('size') : 1;
  const transitionIn = params.get('transition') ? params.get('transition') : 3;
  const textColour = params.get('bg') ? `#${params.get('text')}` : '#fffffa';
  const bgColour = params.get('bg') ? `#${params.get('bg')}` : '#00000033';
  const key = params.get('key') ? `#${params.get('key')}` : 'null';

  // Format messages
  const showLower = lower.text !== '' && lower.visible;

  // transition segments
  const eight = transitionIn / 8;
  const quarter = transitionIn / 4;
  const third = transitionIn / 3;
  const half = transitionIn / 2;

  // motion
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
  
  return (
    <div
      className={style.lowerThird}
      style={{
        backgroundColor: key,
        color: textColour,
        fontSize: `${size * 4}vh`,
      }}
    >
      <motion.div
        className={style.lowerContainer}
        style={{ backgroundColor: bgColour }}
        variants={lowerThirdVariants}
        initial='hidden'
        animate='visible'
        exit={{ opacity: 0 }}
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
          <motion.div className={style.subtitle} variants={subtitleVariants}>
            {title.presenterNow}
          </motion.div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showLower && (
          <motion.div
            className={style.messageContainer}
            key='modal'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={style.message}>{lower.text}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
