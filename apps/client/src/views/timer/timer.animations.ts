import { motion } from 'framer-motion';

import TitleCard from '../../common/components/title-card/TitleCard';

export const titleVariants = {
  hidden: {
    x: -2500,
  },
  visible: {
    x: 0,
    transition: {
      duration: 1,
    },
  },
  exit: {
    x: -2500,
  },
};

export const MotionTitleCard = motion(TitleCard);
