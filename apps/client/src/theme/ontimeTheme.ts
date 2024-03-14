import { createTheme } from '@mantine/core';

import themeClasses from './appTheme.module.scss';

export const theme = createTheme({
  fontFamily: 'Open Sans, Segoe UI, sans-serif',
  fontSizes: {
    xs: 'calc(1rem - 3px)',
    sm: 'calc(1rem - 2px)',
    md: '1rem',
    lg: '1rem',
    xl: '1.5rem',
  },
  radius: {
    xs: '2px',
    sm: '2px',
    md: '3px',
    lg: '3px',
    xl: '99px',
  },
  white: '#ffffee',
  defaultRadius: 'md',
  cursorType: 'pointer', // pointer on interactive elements, eg. label
  activeClassName: themeClasses.active,
});
